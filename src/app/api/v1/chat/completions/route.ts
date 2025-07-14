
import { NextRequest, NextResponse } from 'next/server';
import { getApiKeys } from '@/lib/apiKeyService';
import { recordConnection } from '@/lib/connectionLogService';
import { recordUsage } from '@/lib/metricsService';
import { z } from 'zod';

const OLLAMA_TARGET_URL = process.env.OLLAMA_TARGET_URL || 'http://host.docker.internal:11434';

const functionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()),
});

const toolSchema = z.object({
  type: z.literal('function'),
  function: functionSchema,
});

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().nullable(),
});

const completionsRequestSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema),
  tools: z.array(toolSchema).optional(),
  tool_choice: z.string().optional(),
});


function formatToolsForPrompt(tools: z.infer<typeof toolSchema>[]): string {
    if (!tools || tools.length === 0) {
        return "You have no tools available.";
    }

    const toolInstructions = tools.map(tool => {
        const { name, description, parameters } = tool.function;
        const paramsString = JSON.stringify(parameters, null, 2);
        return `
### Tool: ${name}
- Description: ${description}
- Parameters (JSON Schema):
${paramsString}
`;
    }).join('\n');

    return `
You have access to the following tools. To use a tool, you must respond with a JSON object with a single "tool_call" key.
The value of "tool_call" must be an object containing the "name" of the tool and the "arguments" as an object.
Do not add any other text, just the JSON object.

Example response for a tool call:
{"tool_call": {"name": "tool_name", "arguments": {"param1": "value1", "param2": "value2"}}}

Here are the available tools:
${toolInstructions}
`.trim();
}


export async function POST(req: NextRequest) {
  console.log('[Completions] Received POST request');

  try {
    // 1. Authenticate the request
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.error('[Completions] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key. Header should be in the format "Authorization: Bearer YOUR_API_KEY".' }, { status: 401 });
    }
    
    const apiKey = authorization.split(' ')[1];
    const apiKeys = await getApiKeys();
    const keyDetails = apiKeys.find(k => k.key === apiKey && k.status === 'active');

    if (!keyDetails) {
      console.error(`[Completions] Unauthorized: Invalid or revoked API key: ...${apiKey.slice(-4)}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or revoked API key' }, { status: 401 });
    }
    console.log(`[Completions] API key validated for: "${keyDetails.name}"`);

    // Asynchronously record connection & usage
    recordConnection({ 
        keyId: keyDetails.id, 
        keyName: keyDetails.name, 
        path: `/api/v1/chat/completions`,
        ip: req.ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
        geo: req.geo ? { city: req.geo.city, country: req.geo.country } : undefined
    }).catch(err => console.error(`[Completions] Failed to record connection for key ${keyDetails.id}:`, err));
    
    recordUsage(keyDetails.id).catch(err => console.error(`[Completions] Failed to record usage for key ${keyDetails.id}:`, err));
    
    // 2. Validate and parse the request body
    const body = await req.json();
    const validationResult = completionsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[Completions] Invalid request body:', validationResult.error.errors);
      return NextResponse.json({ error: 'Invalid request body', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { model, messages, tools } = validationResult.data;

    // 3. Format the request for Ollama
    const toolPromptSection = formatToolsForPrompt(tools || []);
    const systemMessage = messages.find(m => m.role === 'system');
    
    let finalSystemPrompt = toolPromptSection;
    if(systemMessage && systemMessage.content) {
        finalSystemPrompt = `${systemMessage.content}\n\n${toolPromptSection}`;
    }

    const userMessages = messages.filter(m => m.role !== 'system');
    const ollamaPrompt = userMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const ollamaRequestBody = {
      model: model,
      prompt: ollamaPrompt,
      system: finalSystemPrompt,
      stream: false,
      format: "json", // Force JSON output to reliably detect tool calls
    };

    console.log(`[Completions] Forwarding request to Ollama with model "${model}" for key "${keyDetails.name}"`);

    // 4. Call Ollama
    const targetUrl = new URL(`${OLLAMA_TARGET_URL}/api/generate`);
    const ollamaResponse = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaRequestBody),
    });

    if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error(`[Completions] Ollama returned an error: ${ollamaResponse.status} ${errorText}`);
        return NextResponse.json({ error: 'Error from upstream service (Ollama)', details: errorText }, { status: ollamaResponse.status });
    }

    const ollamaResult = await ollamaResponse.json();
    const responseText = ollamaResult.response.trim();

    // 5. Parse Ollama response and format for client
    try {
        const responseJson = JSON.parse(responseText);
        if (responseJson.tool_call) {
            console.log(`[Completions] Detected tool call in response for key "${keyDetails.name}".`);
            return NextResponse.json({
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: null,
                        tool_calls: [{
                            id: `call_${Date.now()}`,
                            type: 'function',
                            function: {
                                name: responseJson.tool_call.name,
                                arguments: JSON.stringify(responseJson.tool_call.arguments),
                            },
                        }],
                    },
                    finish_reason: 'tool_calls',
                }],
            });
        }
    } catch (e) {
        // Not a JSON response or doesn't contain a tool_call, treat as standard text.
    }
    
    console.log(`[Completions] Detected standard text response for key "${keyDetails.name}".`);
    return NextResponse.json({
        choices: [{
            index: 0,
            message: {
                role: 'assistant',
                content: responseText,
            },
            finish_reason: 'stop',
        }],
    });

  } catch (error: any) {
    if (error instanceof SyntaxError) {
        console.error(`[Completions] Invalid JSON in request body:`, error.message);
        return NextResponse.json({ error: 'Invalid request body. The provided JSON is malformed.' }, { status: 400 });
    }
    console.error(`[Completions] Internal Server Error:`, error);
    return NextResponse.json({ error: 'An unexpected internal error occurred.', details: error.message }, { status: 500 });
  }
}
