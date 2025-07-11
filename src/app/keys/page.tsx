
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiKeys as initialApiKeys } from "@/lib/data";
import { ApiKey } from "@/types";
import { Plus, MoreVertical, Copy, Trash2, Ban, Pencil } from "lucide-react";
import { GenerateKeyDialog } from "@/components/generate-key-dialog";
import { EditKeyDialog } from "@/components/edit-key-dialog";
import { toast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function KeysPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(initialApiKeys);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState<ApiKey | null>(null);

  const handleKeyGenerated = (key: ApiKey) => {
    setApiKeys((prev) => [key, ...prev]);
  };
  
  const handleKeyUpdated = (updatedKey: ApiKey) => {
    setApiKeys(apiKeys.map(k => k.id === updatedKey.id ? updatedKey : k));
    setSelectedKey(null);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({ title: "Copied!", description: "API Key copied to clipboard."})
  }
  
  const revokeKey = (keyId: string) => {
    setApiKeys(apiKeys.map(k => k.id === keyId ? {...k, status: 'revoked'} : k))
    toast({ title: "Key Revoked", description: "The API key has been revoked.", variant: "destructive"})
  }

  const deleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== keyId))
    toast({ title: "Key Deleted", description: "The API key has been permanently deleted.", variant: "destructive"})
  }

  const openEditDialog = (key: ApiKey) => {
    setSelectedKey(key);
    setIsEditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">
            Manage API keys for accessing your services.
            </p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Generate New Key
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Usage (30d)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {key.key.substring(0, 11)}...{key.key.substring(key.key.length - 4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.status === "active" ? "secondary" : "destructive"} className="capitalize bg-primary/20 text-primary-foreground">
                      {key.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>{key.usage.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(key)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyKey(key.key)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Key
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-yellow-500 focus:text-yellow-400 focus:bg-yellow-950/50">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Revoke
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to revoke this key?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will disable the key immediately. This action can be undone later.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => revokeKey(key.id)} className="bg-yellow-500 hover:bg-yellow-600">Revoke Key</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the API key.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteKey(key.id)} className="bg-destructive hover:bg-destructive/90">Delete Key</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <GenerateKeyDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onKeyGenerated={handleKeyGenerated}
      />
      {selectedKey && (
         <EditKeyDialog
            key={selectedKey.id}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onKeyUpdated={handleKeyUpdated}
            apiKey={selectedKey}
        />
      )}
    </div>
  );
}
