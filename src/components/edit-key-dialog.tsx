
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
import { useEffect } from "react"
import { updateApiKey } from "@/app/keys/actions"

interface EditKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeyUpdated: (key: ApiKey) => void
  apiKey: ApiKey
}

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
})

export function EditKeyDialog({ open, onOpenChange, onKeyUpdated, apiKey }: EditKeyDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: apiKey.name,
    },
  })
  
  useEffect(() => {
    form.reset({
        name: apiKey.name,
    });
  }, [apiKey, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedKey: ApiKey = {
      ...apiKey,
      name: values.name,
    }
    await updateApiKey(updatedKey);
    onKeyUpdated(updatedKey);
    toast({
        title: "API Key Updated",
        description: `Key "${values.name}" has been successfully updated.`,
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
          <DialogTitle className="font-headline">Edit API Key</DialogTitle>
          <DialogDescription>
            Update the details for your API key.
          </DialogDescription>
        </DialogHeader>
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
                 <div className="space-y-2">
                    <Label>Key</Label>
                    <Input readOnly disabled value={`${apiKey.key.substring(0, 11)}...`} className="font-mono" />
                </div>
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
