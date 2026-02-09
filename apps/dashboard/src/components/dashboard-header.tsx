'use client'

import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardHeader() {
  const { user, isLoading, logout } = useAuth()

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border px-4">
      <SidebarTrigger>
        <Menu className="size-4" />
      </SidebarTrigger>
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : user ? (
          <span className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName}
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          title="Sign out"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
