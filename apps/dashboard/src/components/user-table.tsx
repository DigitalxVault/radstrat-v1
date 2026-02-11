'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Eye,
  KeyRound,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { useUsers } from '@/hooks/use-users'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { EditUserDialog } from '@/components/edit-user-dialog'
import { DeleteUserDialog } from '@/components/delete-user-dialog'
import { ImportDialog } from '@/components/import-dialog'
import { AddUserDialog } from '@/components/add-user-dialog'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
  initialRt: number | null
  currentRt: number | null
}

// Map TanStack Table column IDs to API sortBy values
const COLUMN_SORT_MAP: Record<string, string> = {
  name: 'name',
  email: 'email',
  role: 'role',
  status: 'status',
  lastLogin: 'lastLogin',
  createdAt: 'createdAt',
}

export function UserTable() {
  const router = useRouter()
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

  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const sortBy = sorting.length > 0 ? COLUMN_SORT_MAP[sorting[0].id] : undefined
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined

  const { data, isLoading } = useUsers({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    isActive: activeFilter || undefined,
    sortBy,
    sortOrder,
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      const timer = setTimeout(() => setDebouncedSearch(value), 400)
      return () => clearTimeout(timer)
    },
    [],
  )

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        id: 'email',
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }) => {
          const role = getValue<string>()
          return (
            <Badge variant={role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
              {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Player'}
            </Badge>
          )
        },
      },
      {
        id: 'status',
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => {
          const isActive = getValue<boolean>()
          return (
            <Badge variant={isActive ? 'default' : 'destructive'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        id: 'initialRt',
        accessorKey: 'initialRt',
        header: 'Initial RT',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {getValue<number | null>() != null ? getValue<number>() : '—'}
          </span>
        ),
      },
      {
        id: 'currentRt',
        accessorKey: 'currentRt',
        header: 'Current RT',
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums">
            {getValue<number | null>() != null ? getValue<number>() : '—'}
          </span>
        ),
      },
      {
        id: 'lastLogin',
        accessorKey: 'lastLoginAt',
        header: 'Last Login',
        cell: ({ getValue }) => {
          const val = getValue<string | null>()
          return (
            <span className="text-muted-foreground text-sm">
              {val ? new Date(val).toLocaleDateString() : 'Never'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original
          return (
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
          )
        },
      },
    ],
    [router],
  )

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.totalPages ?? -1,
  })

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
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="size-3.5" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="size-3.5" />
                            ) : (
                              <ArrowUpDown className="size-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: pagination.pageSize > 20 ? 10 : 5 }).map((_, i) => (
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
              : table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {data.total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}–
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })
                }
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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
