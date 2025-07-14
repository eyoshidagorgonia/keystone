"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ServiceConfig } from "@/types"
import { toast } from "@/hooks/use-toast"
import { updateService } from "@/app/services/actions"
import { useEffect } from "react"

interface EditServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onServiceUpdated: (service: ServiceConfig) => void
  service: ServiceConfig
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  targetUrl: z.string().url("Please enter a valid URL (e.g., http://localhost:11434)."),
  apiKey: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  supportedModels: z.string().optional(),
})

export function EditServiceDialog({ open, onOpenChange, onServiceUpdated, service }: EditServiceDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      targetUrl: service.targetUrl,
      apiKey: service.apiKey || "",
      status: service.status,
      supportedModels: service.supportedModels || "",
    },
  })
  
  useEffect(() => {
    form.reset({
        name: service.name,
        targetUrl: service.targetUrl,
        apiKey: service.apiKey || "",
        status: service.status,
        supportedModels: service.supportedModels || "",
    });
  }, [service, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedService: ServiceConfig = {
      ...service,
      ...values,
    }
    await updateService(updatedService);
    onServiceUpdated(updatedService);
    toast({
        title: "Service Updated",
        description: `Service "${values.name}" has been successfully updated.`,
    })
    onOpenChange(false);
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Service</DialogTitle>
          <DialogDescription>
            Update the configuration for your AI service.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., My Ollama Server" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div>
                    <Label>Service Type</Label>
                    <Input disabled readOnly value={service.type} />
                </div>
                 <FormField
                    control={form.control}
                    name="targetUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Target URL</FormLabel>
                        <FormControl>
                            <Input placeholder="http://host.docker.internal:11434" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="supportedModels"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Supported Models</FormLabel>
                        <FormControl>
                            <Input placeholder="llama3, gemma:7b, etc." {...field} />
                        </FormControl>
                         <FormDescription>
                            A comma-separated list of models for this service.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>AI Service API Key (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Leave blank if not needed" {...field} />
                        </FormControl>
                         <FormDescription>
                            The API key for the target service itself, if required.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
