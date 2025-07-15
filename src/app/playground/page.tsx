
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock } from '@/components/code-block';
import type { ApiKey, ServiceConfig } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Terminal, Bot, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';


export default function PlaygroundPage() {
  // Shared state
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
  const [services, setServices] = React.useState<ServiceConfig[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Ollama state
  const [ollamaPrompt, setOllamaPrompt] = React.useState('Why is the sky blue?');
  const [ollamaModel, setOllamaModel] = React.useState('llama3');
  const [ollamaResponse, setOllamaResponse] = React.useState<string>('');

  // Stable Diffusion state
  const [sdPrompt, setSdPrompt] = React.useState('a futuristic cityscape at sunset, epic, cinematic, 4k');
  const [sdSteps, setSdSteps] = React.useState(25);
  const [sdModel, setSdModel] = React.useState('sd_xl_base_1.0.safetensors');
  const [sdResponseImage, setSdResponseImage] = React.useState<string>('');
  
  const parseModels = (modelsString?: string): string[] => {
    if (!modelsString) return [];
    return modelsString.split(',').map(m => m.trim()).filter(Boolean);
  };
  
  const ollamaService = services.find(s => s.type === 'ollama' && s.status === 'active');
  const sdService = services.find(s => s.type === 'stable-diffusion-a1111' && s.status === 'active');
  const ollamaSupportedModels = parseModels(ollamaService?.supportedModels);
  const sdSupportedModels = parseModels(sdService?.supportedModels);


  React.useEffect(() => {
    async function fetchData() {
      try {
        const [keysResponse, servicesResponse] = await Promise.all([
            fetch('/api/v1/keys'),
            fetch('/api/v1/services')
        ]);

        if (!keysResponse.ok) throw new Error('Failed to fetch API keys');
        const keys = await keysResponse.json();
        const activeKeys = keys.filter((k: ApiKey) => k.status === 'active');
        setApiKeys(activeKeys);
        if (activeKeys.length > 0) {
          setSelectedKey(activeKeys[0].key);
        }

        if(!servicesResponse.ok) throw new Error('Failed to fetch services');
        const serviceData = await servicesResponse.json();
        setServices(serviceData);

      } catch (e: any) {
        setError("Could not load initial data. " + e.message);
      }
    }
    fetchData();
  }, []);
  
  const handleError = async (response: Response) => {
    try {
        const errorData = await response.json();
        return errorData.details || errorData.error || 'An unknown error occurred.';
    } catch (e) {
        return `Request failed with status ${response.status}. Could not parse error response.`;
    }
  }

  const handleOllamaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
      toast({ title: 'No API Key Selected', description: 'Please select an API key.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setOllamaResponse('');
    setSdResponseImage('');
    setError('');

    try {
      const res = await fetch('/api/v1/proxy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${selectedKey}` },
        body: JSON.stringify({ model: ollamaModel, prompt: ollamaPrompt, stream: false }),
      });

      if (!res.ok) {
        const errorMessage = await handleError(res);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setOllamaResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) {
        toast({ title: 'No API Key Selected', description: 'Please select an API key.', variant: 'destructive' });
        return;
    }
    setIsLoading(true);
    setSdResponseImage('');
    setOllamaResponse('');
    setError('');

    try {
      const res = await fetch('/api/v1/sd/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${selectedKey}` },
        body: JSON.stringify({
          prompt: sdPrompt,
          steps: sdSteps,
          override_settings: { sd_model_checkpoint: sdModel }
        }),
      });

      if (!res.ok) {
        const errorMessage = await handleError(res);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setSdResponseImage(`data:image/png;base64,${data.images[0]}`);
      } else {
        setOllamaResponse(JSON.stringify(data, null, 2)); // Show response if no image
        throw new Error("No image found in the response from Stable Diffusion.");
      }
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Playground</h1>
        <p className="text-muted-foreground">
          Test your service integrations directly from the UI.
        </p>
      </header>

      <Tabs defaultValue="ollama" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ollama">
                <Bot className="mr-2 h-4 w-4"/>
                Ollama Text Generation
            </TabsTrigger>
            <TabsTrigger value="sd">
                <ImageIcon className="mr-2 h-4 w-4"/>
                Stable Diffusion Images
            </TabsTrigger>
        </TabsList>
        
        {/* Ollama Tab */}
        <TabsContent value="ollama">
            <Card>
                <form onSubmit={handleOllamaSubmit}>
                <CardHeader>
                    <CardTitle className="font-headline">Send a Text Query</CardTitle>
                    <CardDescription>
                        Select an API key and enter a prompt to test your Ollama service.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-1">
                            <Label htmlFor="ollama-api-key">API Key</Label>
                            <Select onValueChange={setSelectedKey} value={selectedKey} >
                                <SelectTrigger id="ollama-api-key"> <SelectValue placeholder="Select a key" /> </SelectTrigger>
                                <SelectContent>
                                {apiKeys.map((key) => (
                                    <SelectItem key={key.id} value={key.key} disabled={key.status !== 'active'}>
                                        {key.name} ({key.status})
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                             <Label htmlFor="ollama-model">Model</Label>
                            <div className="flex gap-2">
                                <Input id="ollama-model" placeholder="e.g., llama3" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} />
                                <Select onValueChange={(value) => setOllamaModel(value)} value={ollamaModel} disabled={ollamaSupportedModels.length === 0}>
                                    <SelectTrigger id="ollama-model-select" className="w-[180px]"> <SelectValue placeholder="Presets" /> </SelectTrigger>
                                    <SelectContent>
                                        {ollamaSupportedModels.map((model) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="ollama-prompt">Prompt</Label>
                        <Textarea id="ollama-prompt" placeholder="Enter your prompt here" value={ollamaPrompt} onChange={(e) => setOllamaPrompt(e.target.value)} rows={4} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading || !ollamaService}> 
                        {isLoading ? 'Sending...' : (ollamaService ? 'Send Request' : 'Ollama Service Inactive')}
                    </Button>
                </CardFooter>
                </form>
            </Card>
        </TabsContent>

        {/* Stable Diffusion Tab */}
        <TabsContent value="sd">
            <Card>
                 <form onSubmit={handleSdSubmit}>
                    <CardHeader>
                        <CardTitle className="font-headline">Generate an Image</CardTitle>
                        <CardDescription>
                            Select an API key and enter a prompt to test your Stable Diffusion service.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="md:col-span-1">
                                <Label htmlFor="sd-api-key">API Key</Label>
                                <Select onValueChange={setSelectedKey} value={selectedKey}>
                                    <SelectTrigger id="sd-api-key"> <SelectValue placeholder="Select a key" /> </SelectTrigger>
                                    <SelectContent>
                                        {apiKeys.map((key) => (
                                        <SelectItem key={key.id} value={key.key} disabled={key.status !== 'active'}>
                                            {key.name} ({key.status})
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="md:col-span-2">
                                <Label htmlFor="sd-model">Model Checkpoint</Label>
                                 <div className="flex gap-2">
                                    <Input id="sd-model" placeholder="e.g., sd_xl_base_1.0.safetensors" value={sdModel} onChange={(e) => setSdModel(e.target.value)} />
                                     <Select onValueChange={(value) => setSdModel(value)} value={sdModel} disabled={sdSupportedModels.length === 0}>
                                        <SelectTrigger id="sd-model-select" className="w-[180px]"> <SelectValue placeholder="Presets" /> </SelectTrigger>
                                        <SelectContent>
                                            {sdSupportedModels.map((model) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                         </div>
                         <div>
                            <Label htmlFor="sd-steps">Steps</Label>
                            <Input id="sd-steps" type="number" value={sdSteps} onChange={(e) => setSdSteps(parseInt(e.target.value, 10))} />
                         </div>
                         <div>
                            <Label htmlFor="sd-prompt">Prompt</Label>
                            <Textarea id="sd-prompt" placeholder="Enter your image prompt here" value={sdPrompt} onChange={(e) => setSdPrompt(e.target.value)} rows={4} />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isLoading || !sdService}> 
                            {isLoading ? 'Generating...' : (sdService ? 'Generate Image' : 'SD Service Inactive')}
                         </Button>
                    </CardFooter>
                 </form>
            </Card>
        </TabsContent>
      </Tabs>

        {error && (
            <Alert variant="destructive" className="mt-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Request Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

      {ollamaResponse && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Terminal className="h-5 w-5"/> API Response</CardTitle>
            <CardDescription> The raw JSON response from the API. </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="json">{ollamaResponse}</CodeBlock>
          </CardContent>
        </Card>
      )}

      {sdResponseImage && (
        <Card className="mt-8">
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><ImageIcon className="h-5 w-5"/> Generated Image</CardTitle>
                <CardDescription> The image returned from the Stable Diffusion service. </CardDescription>
            </CardHeader>
            <CardContent>
                <Image src={sdResponseImage} alt="Generated by Stable Diffusion" width={512} height={512} className="rounded-lg border" />
            </CardContent>
        </Card>
      )}

    </div>
  );
}

    