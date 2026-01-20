'use client';

import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateFreightParty,
  useCreateFreightWarehouse,
  useDeactivateFreightParty,
  useDeactivateFreightWarehouse,
  useFreightParties,
  useFreightWarehouses,
  useUpdateFreightParty,
  useUpdateFreightWarehouse,
} from '@/hooks/freight/use-freight-master-data';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightParty, FreightWarehouse } from '@/lib/freight/api-types';
import {
  createPartySchema,
  createWarehouseSchema,
} from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type CreateCustomerFormValues = z.infer<typeof createPartySchema>;
type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;

const PARTY_ROLE_OPTIONS = [
  'CUSTOMER',
  'SHIPPER',
  'CONSIGNEE',
  'CARRIER',
  'AGENT',
] as const;

function getPartyPhone(party: FreightParty) {
  const v = party.contactInfo as unknown;
  if (typeof v !== 'object' || v === null) return '';
  const phone = (v as any).phone;
  return typeof phone === 'string' ? phone : '';
}

function getPartyEmail(party: FreightParty) {
  const v = party.contactInfo as unknown;
  if (typeof v !== 'object' || v === null) return '';
  const email = (v as any).email;
  return typeof email === 'string' ? email : '';
}

function RoleBadge({
  role,
  label,
}: {
  role: (typeof PARTY_ROLE_OPTIONS)[number] | string;
  label: string;
}) {
  const variant =
    role === 'CUSTOMER'
      ? 'default'
      : role === 'CARRIER'
        ? 'secondary'
        : 'outline';
  return (
    <Badge variant={variant} className="mr-1 mb-1">
      {label}
    </Badge>
  );
}

function CustomerUpsertDialog({
  mode,
  initial,
  trigger,
  onClose,
}: {
  mode: 'create' | 'edit';
  initial?: FreightParty;
  trigger?: ReactNode;
  onClose?: () => void;
}) {
  const t = useTranslations('Dashboard.freight.settings.customers');
  const [open, setOpen] = useState(mode === 'edit');
  const createMutation = useCreateFreightParty();
  const updateMutation = useUpdateFreightParty(initial?.id ?? '');

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createPartySchema),
    defaultValues: {
      name: initial?.name ?? '',
      roles: initial?.roles?.length ? initial.roles : ['CUSTOMER'],
      contactInfo: {
        phone: initial ? getPartyPhone(initial) : '',
        email: initial ? getPartyEmail(initial) : '',
      },
      address: initial?.address ?? '',
      remarks: initial?.remarks ?? '',
      isActive: initial?.isActive ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body: CreateCustomerFormValues = {
        ...values,
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
        remarks: values.remarks?.trim() || undefined,
        roles:
          values.roles && values.roles.length > 0 ? values.roles : ['CUSTOMER'],
        contactInfo:
          values.contactInfo &&
          (values.contactInfo.phone?.trim() || values.contactInfo.email?.trim())
            ? {
                phone: values.contactInfo.phone?.trim() || undefined,
                email: values.contactInfo.email?.trim() || undefined,
              }
            : undefined,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(body);
        toast.success(t('created'));
      } else {
        await updateMutation.mutateAsync(body);
        toast.success(t('updated'));
      }
      setOpen(false);
      onClose?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : mode === 'create'
            ? t('createFailed')
            : t('updateFailed')
      );
    }
  });

  const selectedRoles = form.watch('roles') ?? [];
  const roleLabel = (role: string) => t(`roleLabels.${role}` as any);
  const customerRoles = ['CUSTOMER'] as const;
  const freightRoles = PARTY_ROLE_OPTIONS.filter((r) => r !== 'CUSTOMER');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose?.();
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('new') : t('edit')}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('newDescription') : t('editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t('fields.name')}</Label>
            <Input
              id="customer-name"
              autoComplete="off"
              {...form.register('name')}
            />
            {form.formState.errors.name?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('fields.roles')}</Label>
            <div className="space-y-3">
              <div>
                <div className="mb-2 text-muted-foreground text-sm">
                  {t('roleGroups.customer')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {customerRoles.map((role) => {
                    const checked = selectedRoles.includes(role);
                    const toggle = () => {
                      const next = !checked;
                      const nextRoles = next
                        ? Array.from(new Set([...selectedRoles, role]))
                        : selectedRoles.filter((r) => r !== role);
                      form.setValue('roles', nextRoles, {
                        shouldDirty: true,
                      });
                    };
                    return (
                      <div
                        key={role}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        onClick={toggle}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={toggle}
                          className="pointer-events-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{roleLabel(role)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-muted-foreground text-sm">
                  {t('roleGroups.freight')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {freightRoles.map((role) => {
                    const checked = selectedRoles.includes(role);
                    const toggle = () => {
                      const next = !checked;
                      const nextRoles = next
                        ? Array.from(new Set([...selectedRoles, role]))
                        : selectedRoles.filter((r) => r !== role);
                      form.setValue('roles', nextRoles, {
                        shouldDirty: true,
                      });
                    };
                    return (
                      <div
                        key={role}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        onClick={toggle}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={toggle}
                          className="pointer-events-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{roleLabel(role)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {form.formState.errors.roles?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.roles.message as string}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">{t('fields.phone')}</Label>
              <Input
                id="customer-phone"
                autoComplete="off"
                {...form.register('contactInfo.phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">{t('fields.email')}</Label>
              <Input
                id="customer-email"
                autoComplete="off"
                {...form.register('contactInfo.email')}
              />
              {form.formState.errors.contactInfo?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactInfo.message as string}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-address">{t('fields.address')}</Label>
            <Input
              id="customer-address"
              autoComplete="off"
              {...form.register('address')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-remarks">{t('fields.remarks')}</Label>
            <Input
              id="customer-remarks"
              autoComplete="off"
              {...form.register('remarks')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                mode === 'create'
                  ? createMutation.isPending
                  : updateMutation.isPending
              }
            >
              {mode === 'create'
                ? createMutation.isPending
                  ? t('creating')
                  : t('create')
                : updateMutation.isPending
                  ? t('updating')
                  : t('update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateWarehouseDialog() {
  const t = useTranslations('Dashboard.freight.settings.warehouses');
  const [open, setOpen] = useState(false);
  const mutation = useCreateFreightWarehouse();

  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: '',
      address: '',
      contactPerson: '',
      phone: '',
      remarks: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body: CreateWarehouseFormValues = {
        ...values,
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
        contactPerson: values.contactPerson?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        remarks: values.remarks?.trim() || undefined,
      };

      await mutation.mutateAsync(body);
      toast.success(t('created'));
      setOpen(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createFailed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t('new')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('new')}</DialogTitle>
          <DialogDescription>{t('newDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">{t('fields.name')}</Label>
            <Input id="wh-name" autoComplete="off" {...form.register('name')} />
            {form.formState.errors.name?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wh-address">{t('fields.address')}</Label>
            <Input
              id="wh-address"
              autoComplete="off"
              {...form.register('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wh-contactPerson">
                {t('fields.contactPerson')}
              </Label>
              <Input
                id="wh-contactPerson"
                autoComplete="off"
                {...form.register('contactPerson')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-phone">{t('fields.phone')}</Label>
              <Input
                id="wh-phone"
                autoComplete="off"
                {...form.register('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wh-remarks">{t('fields.remarks')}</Label>
            <Input
              id="wh-remarks"
              autoComplete="off"
              {...form.register('remarks')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WarehouseUpsertDialog({
  mode,
  initial,
  trigger,
  onClose,
}: {
  mode: 'create' | 'edit';
  initial?: FreightWarehouse;
  trigger?: ReactNode;
  onClose?: () => void;
}) {
  const t = useTranslations('Dashboard.freight.settings.warehouses');
  const [open, setOpen] = useState(mode === 'edit');
  const createMutation = useCreateFreightWarehouse();
  const updateMutation = useUpdateFreightWarehouse(initial?.id ?? '');

  const form = useForm<CreateWarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      contactPerson: initial?.contactPerson ?? '',
      phone: initial?.phone ?? '',
      remarks: initial?.remarks ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const body: CreateWarehouseFormValues = {
        ...values,
        name: values.name.trim(),
        address: values.address?.trim() || undefined,
        contactPerson: values.contactPerson?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        remarks: values.remarks?.trim() || undefined,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(body);
        toast.success(t('created'));
      } else {
        await updateMutation.mutateAsync(body);
        toast.success(t('updated'));
      }

      setOpen(false);
      onClose?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : mode === 'create'
            ? t('createFailed')
            : t('updateFailed')
      );
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose?.();
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('new') : t('edit')}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('newDescription') : t('editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wh-name">{t('fields.name')}</Label>
            <Input id="wh-name" autoComplete="off" {...form.register('name')} />
            {form.formState.errors.name?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wh-address">{t('fields.address')}</Label>
            <Input
              id="wh-address"
              autoComplete="off"
              {...form.register('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wh-contactPerson">
                {t('fields.contactPerson')}
              </Label>
              <Input
                id="wh-contactPerson"
                autoComplete="off"
                {...form.register('contactPerson')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-phone">{t('fields.phone')}</Label>
              <Input
                id="wh-phone"
                autoComplete="off"
                {...form.register('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wh-remarks">{t('fields.remarks')}</Label>
            <Input
              id="wh-remarks"
              autoComplete="off"
              {...form.register('remarks')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                mode === 'create'
                  ? createMutation.isPending
                  : updateMutation.isPending
              }
            >
              {mode === 'create'
                ? createMutation.isPending
                  ? t('creating')
                  : t('create')
                : updateMutation.isPending
                  ? t('updating')
                  : t('update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WarehousesTable({
  warehouses,
  loading,
  error,
}: {
  warehouses: FreightWarehouse[];
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations('Dashboard.freight.settings.warehouses');
  const [editing, setEditing] = useState<FreightWarehouse | null>(null);
  const [deleting, setDeleting] = useState<FreightWarehouse | null>(null);
  const deleteMutation = useDeactivateFreightWarehouse(deleting?.id ?? '');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns = useMemo<ColumnDef<FreightWarehouse>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.name')} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
        meta: { label: t('columns.name') },
        minSize: 160,
        size: 220,
      },
      {
        id: 'contact',
        accessorFn: (w) =>
          [w.contactPerson, w.phone].filter(Boolean).join(' / '),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.contact')} />
        ),
        cell: ({ row }) =>
          [row.original.contactPerson, row.original.phone]
            .filter(Boolean)
            .join(' / ') || '-',
        meta: { label: t('columns.contact') },
        minSize: 160,
        size: 240,
      },
      {
        id: 'address',
        accessorKey: 'address',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.address')} />
        ),
        cell: ({ row }) => row.original.address ?? '-',
        meta: { label: t('columns.address') },
        minSize: 220,
        size: 320,
      },
      {
        id: 'remarks',
        accessorKey: 'remarks',
        enableSorting: false,
        header: () => t('columns.remarks'),
        cell: ({ row }) => row.original.remarks ?? '-',
        meta: { label: t('columns.remarks') },
        minSize: 220,
        size: 320,
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const w = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('actions.menu')}
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(w)}>
                    <PencilIcon className="size-4" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(w)}
                  >
                    <Trash2Icon className="size-4" />
                    {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 60,
      },
    ],
    [t]
  );

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data: warehouses,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: false,
  });

  return (
    <div className="w-full space-y-4">
      <div className="px-0">
        <DataTableAdvancedToolbar table={table} />
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pagination.pageSize }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-14">
                    {Array.from({ length: columns.length }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`} className="py-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {getFreightApiErrorMessage(error)}
                  </TableCell>
                </TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-14">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} className="px-0" />
      </div>

      {editing ? (
        <WarehouseUpsertDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => (!o ? setDeleting(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteMutation.mutateAsync();
                  toast.success(t('actions.deleted'));
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : t('actions.deleteFailed')
                  );
                } finally {
                  setDeleting(null);
                }
              }}
            >
              {t('actions.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartiesTable({
  parties,
  loading,
  error,
  emptyText,
}: {
  parties: FreightParty[];
  loading: boolean;
  error: unknown;
  emptyText: string;
}) {
  const t = useTranslations('Dashboard.freight.settings.customers');
  const [editing, setEditing] = useState<FreightParty | null>(null);
  const [deleting, setDeleting] = useState<FreightParty | null>(null);
  const deleteMutation = useDeactivateFreightParty(deleting?.id ?? '');
  const roleLabel = (role: string) => t(`roleLabels.${role}` as any);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<ColumnDef<FreightParty>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (p) => p.name ?? '',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.name')} />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.name}</div>
        ),
        meta: { label: t('columns.name') },
        minSize: 200,
        size: 260,
      },
      {
        id: 'contact',
        accessorFn: (p) =>
          [getPartyPhone(p), getPartyEmail(p)].filter(Boolean).join(' / '),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.contact')} />
        ),
        cell: ({ row }) =>
          [getPartyPhone(row.original), getPartyEmail(row.original)]
            .filter(Boolean)
            .join(' / ') || '-',
        meta: { label: t('columns.contact') },
        minSize: 200,
        size: 280,
      },
      {
        id: 'roles',
        accessorFn: (p) => p.roles.join(','),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label={t('columns.roles')} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap">
            {row.original.roles.map((r) => (
              <RoleBadge
                key={`${row.original.id}-${r}`}
                role={r}
                label={roleLabel(r)}
              />
            ))}
          </div>
        ),
        meta: { label: t('columns.roles') },
        minSize: 200,
        size: 320,
      },
      {
        id: 'remarks',
        accessorKey: 'remarks',
        enableSorting: false,
        header: () => t('columns.remarks'),
        cell: ({ row }) => row.original.remarks ?? '-',
        meta: { label: t('columns.remarks') },
        minSize: 200,
        size: 320,
      },
      {
        id: 'actions',
        header: () => null,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('actions.menu')}
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(c)}>
                    <PencilIcon className="size-4" />
                    {t('actions.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(c)}
                  >
                    <Trash2Icon className="size-4" />
                    {t('actions.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 60,
      },
    ],
    [roleLabel, t]
  );

  const table = useReactTable({
    data: parties,
    columns,
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: false,
  });

  return (
    <div className="w-full space-y-4">
      <div className="px-0">
        <DataTableAdvancedToolbar table={table} />
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pagination.pageSize }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-14">
                    {Array.from({ length: columns.length }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`} className="py-3">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {getFreightApiErrorMessage(error)}
                  </TableCell>
                </TableRow>
              ) : parties.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-14">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} className="px-0" />
      </div>

      {editing ? (
        <CustomerUpsertDialog
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => (!o ? setDeleting(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteMutation.mutateAsync();
                  toast.success(t('actions.deleted'));
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : t('actions.deleteFailed')
                  );
                } finally {
                  setDeleting(null);
                }
              }}
            >
              {t('actions.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function FreightSettingsPageClient() {
  const t = useTranslations('Dashboard.freight.settings');
  const tCustomers = useTranslations('Dashboard.freight.settings.customers');
  const [warehouseQ, setWarehouseQ] = useState('');
  const [customerQ, setCustomerQ] = useState('');

  const warehousesParams = useMemo(() => ({ q: warehouseQ }), [warehouseQ]);
  const customersParams = useMemo(() => ({ q: '' }), []);

  const warehousesQuery = useFreightWarehouses(warehousesParams);
  const partiesQuery = useFreightParties(customersParams);

  const allParties = useMemo(() => {
    const q = customerQ.trim().toLowerCase();
    const parties = partiesQuery.data ?? [];
    if (q.length === 0) return parties;

    return parties.filter((p) => {
      const phone = getPartyPhone(p).toLowerCase();
      const email = getPartyEmail(p).toLowerCase();
      const name = (p.name ?? '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [customerQ, partiesQuery.data]);
  const customerParties = allParties.filter((p) =>
    p.roles.includes('CUSTOMER')
  );
  const freightParties = allParties.filter(
    (p) => !p.roles.includes('CUSTOMER')
  );

  return (
    <div className="px-4 lg:px-6">
      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses">{t('tabs.warehouses')}</TabsTrigger>
          <TabsTrigger value="customers">{t('tabs.customers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={warehouseQ}
              onChange={(e) => setWarehouseQ(e.target.value)}
              placeholder={t('warehouses.searchPlaceholder')}
              className="w-full sm:w-[320px]"
            />
            <CreateWarehouseDialog />
          </div>

          <WarehousesTable
            warehouses={warehousesQuery.data ?? []}
            loading={warehousesQuery.isLoading}
            error={warehousesQuery.error}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={customerQ}
              onChange={(e) => setCustomerQ(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full sm:w-[320px]"
            />
            <CustomerUpsertDialog
              mode="create"
              trigger={<Button>{tCustomers('new')}</Button>}
            />
          </div>

          <div className="space-y-4">
            <div className="text-muted-foreground text-sm">
              {tCustomers('groups.customers')}
            </div>
            <PartiesTable
              parties={customerParties}
              loading={partiesQuery.isLoading}
              error={partiesQuery.error}
              emptyText={tCustomers('emptyCustomers')}
            />

            <div className="text-muted-foreground text-sm">
              {tCustomers('groups.freight')}
            </div>
            <PartiesTable
              parties={freightParties}
              loading={partiesQuery.isLoading}
              error={partiesQuery.error}
              emptyText={tCustomers('emptyFreight')}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
