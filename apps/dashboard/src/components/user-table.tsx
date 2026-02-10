'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useUsers, useUpdateUser, useResetPassword, useDeleteUser } from '@/hooks/use-users'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { EditUserDialog } from '@/components/edit-user-dialog'
import { DeleteUserDialog } from '@/components/delete-user-dialog'
import { ImportDialog } from '@/components/import-dialog'
import { AddUserDialog } from '@/components/add-user-dialog'

export function UserTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editTarget, setEditTarget] = useState<{
    id: string
    firstName: string
    lastName: string
    email: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  const { data, isLoading } = useUsers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    isActive: activeFilter || undefined,
  })

  const updateUser = useUpdateUser()
  const resetPassword = useResetPassword()
  const deleteUser = useDeleteUser()

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setPage(1)
      // Simple debounce
      const timer = setTimeout(() => setDebouncedSearch(value), 400)
      return () => clearTimeout(timer)
    },
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <Button onClick={() => setAddUserOpen(true)} size="sm" variant="outline">
            <UserPlus className="size-4 mr-1" />
            Add User
          </Button>
          <Button onClick={() => setImportOpen(true)} size="sm">
            <UserPlus className="size-4 mr-1" />
            Import
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Initial RT</TableHead>
              <TableHead>Current RT</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              : data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Player'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'destructive'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {user.initialRt != null ? user.initialRt : '—'}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {user.currentRt != null ? user.currentRt : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/users/${user.id}`)}
                          >
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setEditTarget({
                                id: user.id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                              })
                            }
                          >
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setResetTarget({
                                id: user.id,
                                name: `${user.firstName} ${user.lastName}`,
                              })
                            }
                          >
                            <KeyRound className="size-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setDeleteTarget({
                                id: user.id,
                                name: `${user.firstName} ${user.lastName}`,
                              })
                            }
                          >
                            <Trash2 className="size-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && data?.users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.limit + 1}–
            {Math.min(data.page * data.limit, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      {resetTarget && (
        <ResetPasswordDialog
          userId={resetTarget.id}
          userName={resetTarget.name}
          open={!!resetTarget}
          onOpenChange={(open) => !open && setResetTarget(null)}
        />
      )}

      {editTarget && (
        <EditUserDialog
          user={editTarget}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteUserDialog
          user={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
