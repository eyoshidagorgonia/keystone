import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Manage and monitor your proxied services.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Server className="h-6 w-6" />
            <CardTitle className="font-headline">Ollama Proxy</CardTitle>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-none">Active</Badge>
          </div>
          <CardDescription>
            Proxy for the self-hosted Ollama AI server.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                    <h3 className="font-semibold text-muted-foreground">Target URL</h3>
                    <p>http://host.docker.internal:11434</p>
                </div>
                <div>
                    <h3 className="font-semibold text-muted-foreground">Authentication</h3>
                    <p>API Key</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-muted-foreground">Rate Limiting</h3>
                    <p>Per-key basis</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-muted-foreground">Total Keys</h3>
                    <p>15</p>
                </div>
                <div>
                    <h3 className="font-semibold text-muted-foreground">Requests (30d)</h3>
                    <p>12,234</p>
                </div>
            </div>
        </CardContent>
      </Card>
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
