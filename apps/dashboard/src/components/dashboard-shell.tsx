'use client'

import { SidebarNav } from '@/components/sidebar-nav'
import { DashboardHeader } from '@/components/dashboard-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 p-6 bg-gradient-to-br from-[#EEF5F3] via-[#F0F0F5] to-[#F3EEF8]">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
