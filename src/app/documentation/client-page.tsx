
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { Cpu, Bot, ImageIcon } from "lucide-react";
import type { ServiceConfig } from "@/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function DocumentationClientPage({ services }: { services: ServiceConfig[] }) {
  const [baseUrl, setBaseUrl] = React.useState("http://localhost:9003");
  const ollamaService = services.find(s => s.type === 'ollama');
  const sdService = services.find(s => s.type === 'stable-diffusion-a1111');

  const parseModels = (modelsString?: string): string[] => {
    if (!modelsString) return [];
    return modelsString.split(',').map(m => m.trim()).filter(Boolean);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Documentation</h1>
            <p className="text-muted-foreground">
            How to integrate with the KeyStone API Proxy.
            </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">API Endpoint Base URL</CardTitle>
          <CardDescription>
            Use this to set the base URL for the code examples below. This is useful for testing against different environments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-lg items-center gap-1.5">
            <Label htmlFor="base-url">Base URL</Label>
            <Input 
              type="text" 
              id="base-url" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://your-api-proxy-url" 
            />
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">How The API Proxy Works</CardTitle>
          <CardDescription>
            A high-level overview of the request lifecycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>The KeyStone API Proxy acts as a secure and centralized gateway for your backend AI services. All requests flow through the proxy, which handles authentication, logging, and routing.</p>
            <CodeBlock language="text">
{`Client Application
        │
        │ 1. Request with Gateway API Key
        ▼
╔════════════════════╗
║ KeyStone API Proxy ║
╠════════════════════╣
║ 2. Authenticate Key║
║ 3. Log Connection  ║
║ 4. Record Metrics  ║
║ 5. Route to Service║
╚════════════════════╝
        │
        │ 6. Forward Request (adds Service API Key if needed)
        ▼
Backend AI Service (Ollama, Stable Diffusion, etc.)
        │
        │ 7. Process Request and Return Response
        ▼
╔════════════════════╗
║ KeyStone API Proxy ║
╠════════════════════╣
║ 8. Return Response ║
╚════════════════════╝
        │
        │ 9. Final Response
        ▼
Client Application`}
            </CodeBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Authentication</CardTitle>
          <CardDescription>
            All API requests require a Gateway API key for authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You must include your API key in the 'Authorization' header of your request, using the 'Bearer' scheme.
          </p>
          <CodeBlock language="bash">
            {`Authorization: Bearer YOUR_GATEWAY_API_KEY`}
          </CodeBlock>
           <p>
            You can generate and manage API keys from the "Gateway API Keys" tab in the dashboard.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Configured Services</CardTitle>
            <CardDescription>
                Details on the AI services you have configured in the "Services" tab.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {ollamaService ? (
                <div className="flex items-start gap-4">
                    <Bot className="h-6 w-6 mt-1" />
                    <div>
                        <h3 className="font-semibold">{ollamaService.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Provides proxy access to any Ollama-compatible API. Models are specified via the 'model' parameter in the JSON request body. This supports both the standard '/api/generate' endpoint and the OpenAI-compatible '/v1/chat/completions' endpoint.
                        </p>
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Cpu className="h-4 w-4" /> Configured Models</h4>
                        <div className="flex flex-wrap gap-2">
                            {parseModels(ollamaService.supportedModels).length > 0 ? (
                                parseModels(ollamaService.supportedModels).map(model => (
                                    <Badge key={model} variant="outline" className="font-mono text-xs">{model}</Badge>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No specific models listed for this service.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : ( <p className="text-sm text-muted-foreground">Ollama service not configured.</p> )}
            
            <div className="border-b my-4"></div>

            {sdService ? (
                <div className="flex items-start gap-4">
                    <ImageIcon className="h-6 w-6 mt-1" />
                    <div>
                        <h3 className="font-semibold">{sdService.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Provides proxy access to the AUTOMATIC1111 Stable Diffusion Web UI API. This specifically targets the '/sdapi/v1/txt2img' endpoint. You can dynamically switch models by passing the model checkpoint name in the 'override_settings.sd_model_checkpoint' parameter.
                        </p>
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Cpu className="h-4 w-4" /> Configured Models</h4>
                         <div className="flex flex-wrap gap-2">
                             {parseModels(sdService.supportedModels).length > 0 ? (
                                parseModels(sdService.supportedModels).map(model => (
                                    <Badge key={model} variant="outline" className="font-mono text-xs">{model}</Badge>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">No specific models listed for this service.</p>
                            )}
                        </div>
                    </div>
                </div>
             ) : ( <p className="text-sm text-muted-foreground">Stable Diffusion service not configured.</p> )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ollama: Standard Proxy Endpoint</CardTitle>
          <CardDescription>
            For simple, direct requests to the Ollama '/api/generate' endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>This endpoint forwards requests to the '/api/[...slug]' path of your active Ollama service.</p>
            <h3 className="font-semibold pt-4">Example: cURL to '/api/v1/proxy/generate'</h3>
            <CodeBlock language="bash">
{`curl ${baseUrl}/api/v1/proxy/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -d '{
    "model": "llama3",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'`}
            </CodeBlock>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ollama: OpenAI-Compatible Endpoint</CardTitle>
          <CardDescription>
            For advanced requests using the OpenAI Chat Completions format, including tool calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>Your OpenAI-compatible endpoint is:</p>
            <CodeBlock language="text">
                {`${baseUrl}/api/v1/chat/completions`}
            </CodeBlock>
            <p>
              This endpoint accepts a request body that mirrors the OpenAI Chat Completions API. It can be used as a drop-in replacement for services that integrate with OpenAI.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request with Tool Calling</h3>
            <CodeBlock language="bash">
{`curl ${baseUrl}/api/v1/chat/completions \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -d '{
    "model": "llama3",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in Boston?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              }
            }
          }
        }
      }
    ]
  }'`}
            </CodeBlock>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Stable Diffusion: Image Generation</CardTitle>
          <CardDescription>
            For generating images with the AUTOMATIC1111 API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>Your image generation endpoint is:</p>
            <CodeBlock language="text">
                {`${baseUrl}/api/v1/sd/txt2img`}
            </CodeBlock>
            <p>
              This endpoint proxies requests to the '/sdapi/v1/txt2img' endpoint of your Stable Diffusion service. You can switch the model on-the-fly by providing the 'sd_model_checkpoint' in an 'override_settings' object.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request with Model Override</h3>
            <CodeBlock language="bash">
{`curl ${baseUrl}/api/v1/sd/txt2img \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \\
  -d '{
    "prompt": "a futuristic cityscape at sunset, epic, cinematic, 4k",
    "steps": 25,
    "override_settings": {
      "sd_model_checkpoint": "sd_xl_base_1.0.safetensors"
    }
  }'`}
            </CodeBlock>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Getting Started (Local Development)</CardTitle>
          <CardDescription>
            How to run the services using Docker for local development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The simplest way to run the Admin UI and the API Proxy locally is by using Docker Compose. From the root of the project directory, run the following command:
          </p>
          <CodeBlock language="bash">
            {`docker-compose up --build`}
          </CodeBlock>
           <p>
            This will start the Admin UI on port '9002' and the API Proxy service on port '9003'. You can configure your service target URLs in the "Services" tab of the dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    