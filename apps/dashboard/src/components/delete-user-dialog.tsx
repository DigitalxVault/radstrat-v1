'use client'

import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteUser } from '@/hooks/use-users'

interface DeleteUserDialogProps {
  user: {
    id: string
    name: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser()

  function handleDelete() {
    if (!user) return

    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('User deactivated successfully')
        onOpenChange(false)
      },
      onError: () => toast.error('Failed to deactivate user'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Deactivate User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate <strong>{user?.name}</strong>? This will
            revoke all their active sessions and prevent them from logging in. This action
            can be reversed by reactivating the user.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? 'Deactivating...' : 'Deactivate User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
