'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Copy } from 'lucide-react'
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
import { useImportUsers } from '@/hooks/use-users'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [result, setResult] = useState<{
    email: string
    temporaryPassword: string
  } | null>(null)

  const importUsers = useImportUsers()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('All fields are required')
      return
    }

    importUsers.mutate(
      [{ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() }],
      {
        onSuccess: (data) => {
          if (data.created > 0 && data.temporaryPasswords.length > 0) {
            setResult(data.temporaryPasswords[0])
            toast.success('User created successfully')
          } else if (data.skipped > 0) {
            toast.error('Email already exists')
          } else if (data.errors.length > 0) {
            toast.error(data.errors[0].reason)
          }
        },
        onError: () => toast.error('Failed to create user'),
      },
    )
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result.temporaryPassword)
    toast.success('Password copied to clipboard')
  }

  function handleClose(open: boolean) {
    if (!open) {
      setEmail('')
      setFirstName('')
      setLastName('')
      setResult(null)
      importUsers.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Add User
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'User created. Copy the temporary password below.'
              : 'Create a new player account with an auto-generated password.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-muted p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{result.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temporary Password</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono border">
                    {result.temporaryPassword}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The user will be prompted to change their password on first login.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">First Name</Label>
                <Input
                  id="add-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Last Name</Label>
                <Input
                  id="add-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
          </form>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={importUsers.isPending}>
                {importUsers.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
