
'use client'

import * as React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { exportAllData, importAllData, importAllDataFromString } from './actions'
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
import { UploadCloud, DownloadCloud, AlertTriangle, Copy, Check } from 'lucide-react'

export default function SettingsPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [exportedJson, setExportedJson] = React.useState('')
  const [pastedJson, setPastedJson] = React.useState('')
  const [isCopied, setIsCopied] = React.useState(false)
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await exportAllData()
      const jsonString = JSON.stringify(data, null, 2)
      setExportedJson(jsonString);

      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.download = `keystone-config-backup-${timestamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: 'Export Successful',
        description: 'Your configuration has been downloaded.',
      })
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedJson)
    setIsCopied(true)
    toast({ title: 'Copied!', description: 'Configuration copied to clipboard.' })
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleImportFromFile = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a JSON file to import.',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') {
          throw new Error('Failed to read file content.')
        }
        const data = JSON.parse(text)
        await importAllData(data)
        toast({
          title: 'Import Successful',
          description: 'Your configuration has been restored. The application will now reload to apply the changes.',
        })
        // Reload the page to reflect changes everywhere
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        toast({
          title: 'Import Failed',
          description: error.message,
          variant: 'destructive',
        })
      } finally {
        setIsImporting(false)
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('import-file') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
      }
    }
    reader.readAsText(file)
  }

  const handleImportFromText = async () => {
    if (!pastedJson.trim()) {
        toast({
            title: 'No Text Pasted',
            description: 'Please paste your JSON configuration into the text area.',
            variant: 'destructive',
        })
        return
    }
    setIsImporting(true);
    try {
        await importAllDataFromString(pastedJson);
        toast({
          title: 'Import Successful',
          description: 'Your configuration has been restored. The application will now reload to apply the changes.',
        })
        setTimeout(() => window.location.reload(), 2000);
    } catch(error: any) {
        toast({
          title: 'Import Failed',
          description: error.message,
          variant: 'destructive',
        })
    } finally {
        setIsImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your application configuration data.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <DownloadCloud className="h-5 w-5" />
                Export Configuration
            </CardTitle>
            <CardDescription>
              Download a backup of all settings or copy the configuration as text.
            </CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
              <Textarea 
                placeholder="Click 'Export' to generate the configuration JSON here..."
                readOnly
                value={exportedJson}
                className="min-h-[200px] font-mono text-xs"
              />
           </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export to File'}
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!exportedJson}>
               {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
               Copy
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <UploadCloud className="h-5 w-5" />
                Import Configuration
            </CardTitle>
            <CardDescription>
              Restore settings from a backup file or by pasting the configuration text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-950/20 p-3 text-yellow-300">
                <AlertTriangle className="h-5 w-5 shrink-0"/>
                <p className="text-xs">
                    Warning: Importing will overwrite all current API keys and service settings. This action cannot be undone.
                </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file">Import from File (.json)</Label>
              <div className="flex gap-2">
                <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={isImporting}
                    className="flex-grow"
                />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="secondary" disabled={isImporting || !file}>
                            Import
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently overwrite your existing settings with the content from the selected file. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleImportFromFile} className="bg-destructive hover:bg-destructive/90">
                                Yes, Overwrite from File
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="import-text">Import from Text</Label>
                <Textarea 
                    id="import-text"
                    placeholder="Paste your configuration JSON here..."
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    disabled={isImporting}
                    className="min-h-[200px] font-mono text-xs"
                />
            </div>
          </CardContent>
          <CardFooter>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isImporting || !pastedJson.trim()}>
                        Import from Text
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently overwrite your existing settings with the content from the text area. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImportFromText} className="bg-destructive hover:bg-destructive/90">
                            Yes, Overwrite from Text
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
