'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  Smartphone,
  Activity,
  KeyRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser, useUpdateUser } from '@/hooks/use-users'
import { useUserAnalytics } from '@/hooks/use-analytics'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'

export function UserDetailCard({ userId }: { userId: string }) {
  const router = useRouter()
  const { data: user, isLoading } = useUser(userId)
  const { data: analytics } = useUserAnalytics(userId)
  const updateUser = useUpdateUser()
  const [resetOpen, setResetOpen] = useState(false)

  function handleToggleActive() {
    if (!user) return
    const action = user.isActive ? 'deactivate' : 'activate'
    updateUser.mutate(
      { id: userId, data: { isActive: !user.isActive } },
      {
        onSuccess: () => toast.success(`User ${action}d successfully`),
        onError: () => toast.error(`Failed to ${action} user`),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        User not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResetOpen(true)}>
            <KeyRound className="size-4 mr-1" />
            Reset Password
          </Button>
          <Button
            variant={user.isActive ? 'destructive' : 'default'}
            onClick={handleToggleActive}
            disabled={updateUser.isPending}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Shield className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Player'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Activity className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Smartphone className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Devices</p>
              <p className="font-bold">{user.deviceCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="text-sm font-medium">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{user.email}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Must Change Password:</span>
              <Badge variant={user.mustChangePassword ? 'destructive' : 'secondary'}>
                {user.mustChangePassword ? 'Yes' : 'No'}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Events Logged:</span>
              <span>{user.eventCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {user.progressSummary.hasProgress ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Last Saved:</span>
                  <span>
                    {user.progressSummary.lastSavedAt
                      ? new Date(user.progressSummary.lastSavedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                {analytics?.progress && (
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {JSON.stringify(analytics.progress, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No training progress recorded yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ResetPasswordDialog
        userId={userId}
        userName={`${user.firstName} ${user.lastName}`}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </div>
  )
}
