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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiKeys as initialApiKeys } from "@/lib/data";
import { ApiKey } from "@/types";
import { Plus, MoreVertical, Copy, Trash2, Ban } from "lucide-react";
import { GenerateKeyDialog } from "@/components/generate-key-dialog";
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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleKeyGenerated = (key: ApiKey) => {
    setApiKeys((prev) => [key, ...prev]);
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


  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">
            Manage API keys for accessing your services.
            </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
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
                        <DropdownMenuItem onClick={() => copyKey(key.key)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Key
                        </DropdownMenuItem>
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onKeyGenerated={handleKeyGenerated}
      />
    </div>
  );
}

// Dummy Card component to satisfy compiler
const Card = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm" {...props}>
        {children}
    </div>
);

const CardContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className="p-6" {...props}>
        {children}
    </div>
);
