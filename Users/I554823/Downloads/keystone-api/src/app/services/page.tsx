
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Bot, Image as ImageIcon } from "lucide-react";
import { getApiKeys } from "@/lib/apiKeyService";
import { getMetrics } from "@/lib/metricsService";

export default async function ServicesPage() {
  const apiKeys = await getApiKeys();
  const metrics = await getMetrics();

  const totalKeys = apiKeys.length;
  // Note: This is a simplified total. In a real scenario, you'd want to separate metrics per service.
  const totalRequests = metrics.reduce((acc, stat) => acc + stat.requests, 0); 
  
  const ollamaTargetUrl = process.env.OLLAMA_TARGET_URL || 'http://host.docker.internal:11434';
  const sdTargetUrl = process.env.SD_TARGET_URL || 'http://host.docker.internal:7860';

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Manage and monitor your proxied services.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6" />
              <CardTitle className="font-headline">Ollama LLM Proxy</CardTitle>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-none">Active</Badge>
            </div>
            <CardDescription>
              Proxy for the self-hosted Ollama Large Language Model service.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Target URL</h3>
                      <p className="truncate">{ollamaTargetUrl}</p>
                  </div>
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Authentication</h3>
                      <p>API Key</p>
                  </div>
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Total Keys</h3>
                      <p>{totalKeys}</p>
                  </div>
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Requests (All Time)</h3>
                      <p>{totalRequests.toLocaleString()}</p>
                  </div>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ImageIcon className="h-6 w-6" />
              <CardTitle className="font-headline">Stable Diffusion Proxy</CardTitle>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-none">Active</Badge>
            </div>
            <CardDescription>
              Proxy for the AUTOMATIC1111 Stable Diffusion image generation API.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Target URL</h3>
                      <p className="truncate">{sdTargetUrl}</p>
                  </div>
                   <div>
                      <h3 className="font-semibold text-muted-foreground">Authentication</h3>
                      <p>API Key</p>
                  </div>
                  <div>
                      <h3 className="font-semibold text-muted-foreground">Endpoint</h3>
                      <p>/api/v1/sd/txt2img</p>
                  </div>
                   <div>
                      <h3 className="font-semibold text-muted-foreground">Model Switching</h3>
                      <p>Via `override_settings`</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
            <CardTitle className="font-headline text-muted-foreground/50">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">More service integrations are on the way. Stay tuned!</p>
        </CardContent>
      </Card>
    </div>
  );
}
