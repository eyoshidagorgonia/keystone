
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
            You can generate API keys from the "API Keys" tab in the dashboard.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Making Requests</CardTitle>
          <CardDescription>
            The proxy forwards requests to the Ollama API. Use the standard Ollama API routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>Your API endpoint is:</p>
            <CodeBlock language="text">
                {`http://localhost:9002/api/v1/proxy`}
            </CodeBlock>
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Model Override</AlertTitle>
                <AlertDescription>
                    Please note that the proxy is configured to override the `model` parameter. All requests will be processed using the <strong>llama3.1:8b</strong> model, regardless of the value you send.
                </AlertDescription>
            </Alert>
            <p>
              To interact with the Ollama API, append the standard Ollama path to the proxy endpoint. For example, to generate content, you would post to `/generate`.
            </p>
            <h3 className="font-semibold pt-4">Example: cURL Request</h3>
            <CodeBlock language="bash">
{`curl http://localhost:9002/api/v1/proxy/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Why is the sky blue?",
    "stream": false
  }'`}
            </CodeBlock>

            <h3 className="font-semibold pt-4">Example: Python Request</h3>
            <CodeBlock language="python">
{`import requests
import json

api_key = "YOUR_API_KEY"
proxy_url = "http://localhost:9002/api/v1/proxy/generate"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

data = {
    "model": "llama3.1:8b",
    "prompt": "Why is the sky blue?",
    "stream": False
}

response = requests.post(proxy_url, headers=headers, data=json.dumps(data))

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error: {response.status_code}")
    print(response.text)`}
            </CodeBlock>

            <h3 className="font-semibold pt-4">Example: Node.js (axios) Request</h3>
            <CodeBlock language="javascript">
{`const axios = require('axios');

const apiKey = 'YOUR_API_KEY';
const proxyUrl = 'http://localhost:9002/api/v1/proxy/generate';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
};

const data = {
    model: 'llama3.1:8b',
    prompt: 'Why is the sky blue?',
    stream: false
};

axios.post(proxyUrl, data, { headers })
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error.response ? error.response.data : error.message);
    });`}
            </CodeBlock>

            <h3 className="font-semibold pt-4">Example: TypeScript (fetch) Request</h3>
            <CodeBlock language="typescript">
{`async function generateText() {
  const apiKey = 'YOUR_API_KEY';
  const proxyUrl = 'http://localhost:9002/api/v1/proxy/generate';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`,
  };

  const body = {
    model: 'llama3.1:8b',
    prompt: 'Why is the sky blue?',
    stream: false,
  };

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

generateText();`}
            </CodeBlock>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Schemas</CardTitle>
          <CardDescription>
            Type definitions for API requests and responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <h3 className="font-semibold pt-4">Generate Request Body</h3>
            <CodeBlock language="typescript">
{`interface GenerateRequest {
  model: string; // Note: This parameter is overridden by the proxy.
  prompt: string;
  stream?: boolean;
  // ...other standard Ollama API parameters like 'options', 'system', etc.
}`}
            </CodeBlock>

            <h3 className="font-semibold pt-4">Generate Response Body</h3>
            <CodeBlock language="typescript">
{`interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}`}
            </CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}
