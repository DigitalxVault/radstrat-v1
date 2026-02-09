'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useResetPassword } from '@/hooks/use-users'

interface ResetPasswordDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const resetPassword = useResetPassword()

  function handleReset() {
    resetPassword.mutate(userId, {
      onSuccess: (data) => {
        setTempPassword(data.temporaryPassword)
        toast.success('Password reset successfully')
      },
      onError: () => {
        toast.error('Failed to reset password')
      },
    })
  }

  function handleCopy() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      toast.success('Password copied to clipboard')
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setTempPassword(null)
      resetPassword.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {tempPassword
              ? `New temporary password for ${userName}:`
              : `Generate a new temporary password for ${userName}. This will revoke all active sessions.`}
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted font-mono text-sm">
            <span className="flex-1 select-all">{tempPassword}</span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <Copy className="size-4" />
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          {tempPassword ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReset}
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
