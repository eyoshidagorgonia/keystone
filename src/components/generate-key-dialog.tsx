
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { ApiKey } from "@/types"
import { toast } from "@/hooks/use-toast"
import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { createApiKey } from "@/app/keys/actions"

interface GenerateKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeyGenerated: (key: ApiKey) => void
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  rateLimit: z.coerce.number().min(1, "Rate limit must be at least 1."),
})

export function GenerateKeyDialog({ open, onOpenChange, onKeyGenerated }: GenerateKeyDialogProps) {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rateLimit: 100,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newKey = await createApiKey(values.name, values.rateLimit);
    setGeneratedKey(newKey.key);
    onKeyGenerated(newKey);
    toast({
        title: "API Key Generated",
        description: `Key "${values.name}" has been successfully created.`,
    })
  }

  const handleClose = () => {
    form.reset()
    setGeneratedKey(null)
    setCopied(false)
    onOpenChange(false)
  }

  const handleCopy = () => {
    if (generatedKey) {
        navigator.clipboard.writeText(generatedKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
  }


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate New API Key</DialogTitle>
          <DialogDescription>
            Create a new key to access the Ollama services.
          </DialogDescription>
        </DialogHeader>
        {generatedKey ? (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Here is your new API key. Store it securely as you won't be able to see it again.
                </p>
                <div className="flex items-center space-x-2">
                    <Input id="new-key" value={generatedKey} readOnly className="font-mono"/>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
            </div>
        ) : (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Key Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., My Awesome App" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="rateLimit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rate Limit (requests/min)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button type="submit">Generate Key</Button>
                    </DialogFooter>
                </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
