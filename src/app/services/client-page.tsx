
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
import { Bot, Image as ImageIcon, Plus, Server, Pencil } from "lucide-react";
import type { ServiceConfig } from "@/types";
import { AddServiceDialog } from "@/components/add-service-dialog";
import { EditServiceDialog } from "@/components/edit-service-dialog";
import { toast } from "@/hooks/use-toast";
import * as actions from "./actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Services</h1>
            <p className="text-muted-foreground">
            Manage and monitor your proxied AI services.
            </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add New Service
        </Button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const ServiceIcon = serviceIcons[service.type] || Server;
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
                <div className="space-y-3 text-sm">
                    <div>
                        <h3 className="font-semibold text-muted-foreground">Status</h3>
                         <Badge variant={service.status === "active" ? "secondary" : "destructive"} className={service.status === 'active' ? "bg-green-500/20 text-green-300 border-none" : ""}>
                            {service.status}
                        </Badge>
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
                        <h3 className="font-semibold text-muted-foreground">Authentication</h3>
                        <p>API Key (via Proxy)</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
