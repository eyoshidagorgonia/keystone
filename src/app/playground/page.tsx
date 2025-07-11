
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CodeBlock } from '@/components/code-block';
import { getApiKeys } from '@/app/keys/actions';
import type { ApiKey } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Terminal } from 'lucide-react';

export default function PlaygroundPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string>('');
  const [prompt, setPrompt] = React.useState('Why is the sky blue?');
  const [model, setModel] = React.useState('llama3');
  const [response, setResponse] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchKeys() {
      // This is a bit of a workaround. We can't call the server action directly
      // in a useEffect that runs on initial render. So we just read from the data file.
      // In a real app, this might be an API call.
      try {
        const response = await fetch('/api/v1/keys');
        if (!response.ok) {
            throw new Error('Failed to fetch API keys');
        }
        const keys = await response.json();
        setApiKeys(keys);
        if (keys.length > 0) {
          setSelectedKey(keys[0].key);
        }
      } catch (e: any) {
        setError("Could not load API keys. " + e.message);
      }
    }
    fetchKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      toast({
        title: 'No API Key Selected',
        description: 'Please select an API key to use for the request.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const res = await fetch('/api/v1/proxy/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${selectedKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Playground</h1>
        <p className="text-muted-foreground">
          Test your Ollama service integration directly.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline">Send a Test Query</CardTitle>
            <CardDescription>
              Select an API key and enter a prompt to test your service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Request Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Select onValueChange={setSelectedKey} value={selectedKey} >
                        <SelectTrigger id="api-key">
                        <SelectValue placeholder="Select a key" />
                        </SelectTrigger>
                        <SelectContent>
                        {apiKeys.map((key) => (
                            <SelectItem key={key.id} value={key.key} disabled={key.status !== 'active'}>
                            {key.name} ({key.status})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="model">Model</Label>
                    <Textarea
                        id="model"
                        placeholder="e.g., llama3"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="h-10"
                    />
                 </div>
            </div>
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt here"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Terminal className="h-5 w-5"/> API Response</CardTitle>
            <CardDescription>
              The raw JSON response from the Ollama service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="json">{response}</CodeBlock>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
