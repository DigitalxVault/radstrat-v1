'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useImportUsers } from '@/hooks/use-users'

interface ImportUser {
  email: string
  firstName: string
  lastName: string
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [users, setUsers] = useState<ImportUser[]>([
    { email: '', firstName: '', lastName: '' },
  ])
  const [results, setResults] = useState<{
    created: number
    skipped: number
    errors: Array<{ email: string; reason: string }>
    temporaryPasswords: Array<{ email: string; temporaryPassword: string }>
  } | null>(null)

  const importUsers = useImportUsers()

  function addRow() {
    setUsers([...users, { email: '', firstName: '', lastName: '' }])
  }

  function removeRow(index: number) {
    setUsers(users.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof ImportUser, value: string) {
    setUsers(
      users.map((u, i) => (i === index ? { ...u, [field]: value } : u)),
    )
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      const parsed: ImportUser[] = []

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        if (cols.length >= 3) {
          parsed.push({
            email: cols[0],
            firstName: cols[1],
            lastName: cols[2],
          })
        }
      }

      if (parsed.length > 0) {
        setUsers(parsed)
        toast.success(`Loaded ${parsed.length} users from CSV`)
      } else {
        toast.error('No valid rows found. Expected: email, firstName, lastName')
      }
    }
    reader.readAsText(file)
  }

  function handleSubmit() {
    const validUsers = users.filter(
      (u) => u.email && u.firstName && u.lastName,
    )

    if (validUsers.length === 0) {
      toast.error('Please add at least one valid user')
      return
    }

    importUsers.mutate(validUsers, {
      onSuccess: (data) => {
        setResults(data)
        toast.success(`${data.created} users imported successfully`)
      },
      onError: () => {
        toast.error('Import failed')
      },
    })
  }

  function handleCopyPasswords() {
    if (!results?.temporaryPasswords.length) return
    const text = results.temporaryPasswords
      .map((p) => `${p.email}: ${p.temporaryPassword}`)
      .join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Passwords copied to clipboard')
  }

  function handleClose(open: boolean) {
    if (!open) {
      setUsers([{ email: '', firstName: '', lastName: '' }])
      setResults(null)
      importUsers.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Import Players
          </DialogTitle>
          <DialogDescription>
            {results
              ? 'Import complete. Copy the temporary passwords below.'
              : 'Add players manually or upload a CSV file (email, firstName, lastName).'}
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-muted p-3">
                <p className="text-2xl font-bold text-green-400">{results.created}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-2xl font-bold text-yellow-400">{results.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-2xl font-bold text-red-400">{results.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {results.temporaryPasswords.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Temporary Passwords</Label>
                  <Button variant="ghost" size="sm" onClick={handleCopyPasswords}>
                    <Copy className="size-3 mr-1" />
                    Copy All
                  </Button>
                </div>
                <div className="rounded-md border max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Password</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.temporaryPasswords.map((p) => (
                        <TableRow key={p.email}>
                          <TableCell className="text-sm">{p.email}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {p.temporaryPassword}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <div>
                <Label className="text-destructive">Errors</Label>
                <ul className="mt-1 text-sm text-destructive space-y-1">
                  {results.errors.map((err, i) => (
                    <li key={i}>
                      {err.email}: {err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary transition-colors">
                  <Upload className="size-4" />
                  Upload CSV (email, firstName, lastName)
                </div>
              </Label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </div>

            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          value={user.email}
                          onChange={(e) => updateRow(i, 'email', e.target.value)}
                          placeholder="email@example.com"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={user.firstName}
                          onChange={(e) => updateRow(i, 'firstName', e.target.value)}
                          placeholder="First"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={user.lastName}
                          onChange={(e) => updateRow(i, 'lastName', e.target.value)}
                          placeholder="Last"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        {users.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => removeRow(i)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-4 mr-1" />
              Add Row
            </Button>
          </div>
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={importUsers.isPending}
              >
                {importUsers.isPending
                  ? 'Importing...'
                  : `Import ${users.filter((u) => u.email).length} Users`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
