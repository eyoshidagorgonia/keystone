
"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Image as ImageIcon, Plus, Server, Pencil, Cpu, RefreshCw } from "lucide-react";
import type { ServiceConfig } from "@/types";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { EditServiceDialog } from "@/components/edit-service-dialog";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


const serviceIcons = {
    'ollama': Bot,
    'stable-diffusion-a1111': ImageIcon,
}

const serviceNames = {
    'ollama': 'Ollama LLM Proxy',
    'stable-diffusion-a1111': 'Stable Diffusion (A1111)',
}


export function ServicesClientPage({ initialServices }: { initialServices: ServiceConfig[] }) {
  const [services, setServices] = React.useState<ServiceConfig[]>(initialServices);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<ServiceConfig | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchServices = React.useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/v1/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
      if (showToast) {
        toast({ title: "Services Refreshed", description: "The list of services has been updated." });
      }
    } catch (error: any) {
       if (showToast) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        console.error("Failed to auto-refresh services:", error.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const intervalId = setInterval(() => fetchServices(false), 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, [fetchServices]);

  const handleServiceAdded = (newService: ServiceConfig) => {
    setServices((prev) => [...prev, newService]);
    toast({ title: "Service Added", description: `Successfully added ${newService.name}.` });
  };

  const handleServiceUpdated = (updatedService: ServiceConfig) => {
    setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
    setSelectedService(null);
    toast({ title: "Service Updated", description: `Successfully updated ${updatedService.name}.` });
  };
  
  const openEditDialog = (service: ServiceConfig) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  }

  const parseModels = (modelsString?: string): string[] => {
    if (!modelsString) return [];
    return modelsString.split(',').map(m => m.trim()).filter(Boolean);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Services</h1>
            <p className="text-muted-foreground">
            Manage and monitor your proxied AI services.
            </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => fetchServices(true)} variant="outline" disabled={isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Add New Service
            </Button>
        </div>
      </header>
        
      {services.length === 0 && !isRefreshing ? (
          <Card>
              <CardHeader>
                  <CardTitle>No Services Found</CardTitle>
                  <CardDescription>Get started by adding your first AI service.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="-ml-1 mr-2 h-4 w-4" />
                      Add New Service
                  </Button>
              </CardContent>
          </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const ServiceIcon = serviceIcons[service.type] || Server;
            const supportedModels = parseModels(service.supportedModels);
            return (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <ServiceIcon className="h-6 w-6" />
                          <CardTitle className="font-headline">{service.name}</CardTitle>
                      </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(service)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Service</span>
                      </Button>
                  </div>
                   <CardDescription>
                      {serviceNames[service.type]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <h3 className="font-semibold text-muted-foreground">Status</h3>
                               <Badge variant={service.status === "active" ? "secondary" : "destructive"} className={cn(service.status === 'active' ? "bg-green-500/20 text-green-300 border-none" : "")}>
                                  {service.status}
                              </Badge>
                          </div>
                          <div>
                              <h3 className="font-semibold text-muted-foreground">Gateway Auth</h3>
                              <p>API Key (via Proxy)</p>
                          </div>
                      </div>
                      <div>
                           <h3 className="font-semibold text-muted-foreground">Target URL</h3>
                           <TooltipProvider>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <p className="truncate cursor-default">{service.targetUrl}</p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{service.targetUrl}</p>
                                  </TooltipContent>
                              </Tooltip>
                           </TooltipProvider>
                      </div>
                      <div>
                          <h3 className="font-semibold text-muted-foreground">AI Service API Key</h3>
                          <p className={service.apiKey ? '' : 'text-muted-foreground'}>
                              {service.apiKey ? 'Set' : 'Not Set'}
                          </p>
                      </div>
                       {supportedModels.length > 0 && (
                          <div>
                              <h3 className="font-semibold text-muted-foreground flex items-center gap-2 mb-2"><Cpu className="h-4 w-4" /> Supported Models</h3>
                              <div className="flex flex-wrap gap-2">
                                  {supportedModels.map(model => (
                                      <Badge key={model} variant="outline" className="font-mono text-xs">{model}</Badge>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      <AddServiceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onServiceAdded={handleServiceAdded}
      />

       {selectedService && (
         <EditServiceDialog
            key={selectedService.id}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onServiceUpdated={handleServiceUpdated}
            service={selectedService}
        />
      )}
    </div>
  );
}
