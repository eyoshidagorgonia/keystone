
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          How to integrate with the KeyStone API Proxy.
        </p>
      </header>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Getting Started</CardTitle>
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
            This will start the Admin UI on port `9002` and the API Proxy service on port `9003`. The proxy will forward requests to Ollama on `http://host.docker.internal:11434` and Stable Diffusion on `http://host.docker.internal:7860` by default.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Authentication</CardTitle>
          <CardDescription>
            All API requests require an API key for authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You must include your API key in the `Authorization` header of your request, using the `Bearer` scheme.
          </p>
          <CodeBlock language="bash">
            {`Authorization: Bearer YOUR_API_KEY`}
          </CodeBlock>
           <p>
            You can generate and manage API keys from the "API Keys" tab in the dashboard.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ollama: Standard Proxy Endpoint</CardTitle>
          <CardDescription>
            For simple, direct requests to the Ollama `/api/generate` endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>Your production API proxy endpoint is:</p>
            <CodeBlock language="text">
                {`https://modelapi.nexix.ai/api/v1/proxy`}
            </CodeBlock>
            <p>
              To interact with the Ollama API, append the standard Ollama path to the proxy endpoint. For example, to generate content, you would post to `/generate`.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request</h3>
            <CodeBlock language="bash">
{`curl https://modelapi.nexix.ai/api/v1/proxy/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
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
                {`https://modelapi.nexix.ai/api/v1/chat/completions`}
            </CodeBlock>
            <p>
              This endpoint accepts a request body that mirrors the OpenAI Chat Completions API. It can be used as a drop-in replacement for services that integrate with OpenAI.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request with Tool Calling</h3>
            <CodeBlock language="bash">
{`curl https://modelapi.nexix.ai/api/v1/chat/completions \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
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
                {`https://modelapi.nexix.ai/api/v1/sd/txt2img`}
            </CodeBlock>
            <p>
              This endpoint proxies requests to the `/sdapi/v1/txt2img` endpoint of your Stable Diffusion service. You can switch the model on-the-fly by providing the `sd_model_checkpoint` in an `override_settings` object.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request with Model Override</h3>
            <CodeBlock language="bash">
{`curl https://modelapi.nexix.ai/api/v1/sd/txt2img \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
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
    </div>
  );
}
