
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
import { toast } from '@/hooks/use-toast'
import { exportAllData, importAllData } from './actions'
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
import { UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  
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

  const handleImport = async () => {
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
          description: 'Your configuration has been restored. The application will now reload.',
        })
        // Reload the page to reflect changes
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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
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
              Download a backup of all your Gateway API Keys and Service configurations. Keep this file in a safe place.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export to JSON'}
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
              Restore your configuration from a previously exported JSON backup file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-2 rounded-md border border-yellow-500/50 bg-yellow-950/20 p-3 text-yellow-300">
                <AlertTriangle className="h-5 w-5 shrink-0"/>
                <p className="text-xs">
                    Warning: Importing will overwrite all current API keys and service settings. This action cannot be undone.
                </p>
            </div>
            <div>
              <Label htmlFor="import-file">Configuration File (.json)</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
          </CardContent>
          <CardFooter>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isImporting || !file}>
                        {isImporting ? 'Importing...' : 'Import from JSON'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently overwrite your existing API Keys and Service settings with the content from the selected file. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImport} className="bg-destructive hover:bg-destructive/90">
                            Yes, Overwrite Everything
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
