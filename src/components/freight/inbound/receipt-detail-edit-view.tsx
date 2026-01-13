'use client';

import { EmployeeAssignmentsSection } from '@/components/freight/inbound/employee-assignments-section';
import { ReceiptFeeManagementTab } from '@/components/freight/inbound/receipt-fee-management-tab';
import { ReceiptSummaryPanel } from '@/components/freight/inbound/receipt-summary-panel';
import { ReceiptTransportScheduleSection } from '@/components/freight/inbound/receipt-transport-schedule-section';
import { AddCustomerDialog } from '@/components/freight/shared/add-customer-dialog';
import { BookingAgentCombobox } from '@/components/freight/shared/booking-agent-combobox';
import { CustomerCombobox } from '@/components/freight/shared/customer-combobox';
import { CustomsAgentCombobox } from '@/components/freight/shared/customs-agent-combobox';
import { PortCombobox } from '@/components/freight/shared/port-combobox';
import { ShipperCombobox } from '@/components/freight/shared/shipper-combobox';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { FreightTableSection } from '@/components/freight/ui/freight-table-section';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useCreateFreightHBL,
  useFreightHBL,
  useUpdateFreightHBL,
} from '@/hooks/freight/use-freight-hbl';
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import {
  useCreateFreightMBL,
  useFreightMBL,
  useUpdateFreightMBL,
} from '@/hooks/freight/use-freight-mbl';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightWarehouseReceiptWithRelations,
} from '@/lib/freight/api-types';
import { WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES } from '@/lib/freight/constants';
import { AIR_OPERATION_NODES } from '@/lib/freight/local-receipt-transport-schedule';
import {
  ceilToScaledInt,
  formatCeilFixed,
  formatScaledInt,
} from '@/lib/freight/math';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Package,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const receiptFormSchema = z.object({
  customerId: z.string().optional(),
  customsDeclarationType: z.string().optional(),
  inboundTime: z.string().min(1, '入库时间必填'),
  mblNo: z.string().max(50).optional(),
  soNo: z.string().max(50).optional(),
  hblNo: z.string().max(50).optional(),
  remarks: z.string().optional(),
  internalRemarks: z.string().optional(),
  // Transport schedule (stored in DB)
  airCarrier: z.string().max(200).optional(),
  airFlightNo: z.string().max(100).optional(),
  airFlightDate: z.string().max(20).optional(),
  airArrivalDateE: z.string().max(20).optional(),
  airOperationLocation: z.string().max(200).optional(),
  airOperationNode: z.enum(AIR_OPERATION_NODES).optional(),
  seaCarrierRoute: z.string().max(200).optional(),
  seaVesselVoyage: z.string().max(200).optional(),
  seaEtdE: z.string().max(20).optional(),
  seaEtaE: z.string().max(20).optional(),
  // Employee assignments
  salesEmployeeId: z.string().optional(),
  customerServiceEmployeeId: z.string().optional(),
  overseasCsEmployeeId: z.string().optional(),
  operationsEmployeeId: z.string().optional(),
  documentationEmployeeId: z.string().optional(),
  financeEmployeeId: z.string().optional(),
  bookingEmployeeId: z.string().optional(),
  reviewerEmployeeId: z.string().optional(),
  // Contact information - parties
  shipperId: z.string().optional(),
  bookingAgentId: z.string().optional(),
  customsAgentId: z.string().optional(),
  // MBL port information (unified)
  portOfDestinationId: z.string().optional(),
  portOfDischargeId: z.string().optional(),
  portOfLoadingId: z.string().optional(),
  placeOfReceiptId: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;

function formatDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return '';
  try {
    return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

export function ReceiptDetailEditView({
  receipt,
  onBack,
  onAddItem,
  onDelete,
  onEditItem,
  onDeleteItem,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  onBack: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  onEditItem: (item: FreightInventoryItem) => void;
  onDeleteItem: (item: FreightInventoryItem) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tSummaryPanel = useTranslations(
    'Dashboard.freight.inbound.summaryPanel'
  );
  const tMbl = useTranslations('Dashboard.freight.inbound.mbl');
  const tCommon = useTranslations('Common');
  const tCustomerFields = useTranslations(
    'Dashboard.freight.settings.customers.fields'
  );
  const tCustomerColumns = useTranslations(
    'Dashboard.freight.settings.customers.columns'
  );

  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  const mblQuery = useFreightMBL(receipt.id);
  const createMblMutation = useCreateFreightMBL(receipt.id);
  const updateMblMutation = useUpdateFreightMBL(receipt.id);

  const hblQuery = useFreightHBL(receipt.id);
  const createHblMutation = useCreateFreightHBL(receipt.id);
  const updateHblMutation = useUpdateFreightHBL(receipt.id);

  const itemsQuery = useFreightInventoryItems({
    receiptId: receipt.id,
    q: '',
  });

  const items = itemsQuery.data ?? [];
  const renderedItems = useMemo(() => items, [items]);

  const defaultAirOperationNode = useMemo(() => {
    const node = receipt.airOperationNode ?? undefined;
    if (!node) return undefined;
    return AIR_OPERATION_NODES.includes(node as any)
      ? (node as any)
      : undefined;
  }, [receipt.airOperationNode]);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      customerId: receipt.customerId ?? '',
      customsDeclarationType: receipt.customsDeclarationType ?? '',
      inboundTime: formatDateTimeLocalValue(receipt.inboundTime),
      mblNo: '',
      soNo: '',
      hblNo: '',
      remarks: receipt.remarks ?? '',
      internalRemarks: receipt.internalRemarks ?? '',
      // Transport schedule (stored in DB)
      airCarrier: receipt.airCarrier ?? '',
      airFlightNo: receipt.airFlightNo ?? '',
      airFlightDate: receipt.airFlightDate ?? '',
      airArrivalDateE: receipt.airArrivalDateE ?? '',
      airOperationLocation: receipt.airOperationLocation ?? '',
      airOperationNode: defaultAirOperationNode,
      seaCarrierRoute: receipt.seaCarrierRoute ?? '',
      seaVesselVoyage: receipt.seaVesselVoyage ?? '',
      seaEtdE: receipt.seaEtdE ?? '',
      seaEtaE: receipt.seaEtaE ?? '',
      // Employee assignments (stored in DB)
      salesEmployeeId: receipt.salesEmployeeId ?? '',
      customerServiceEmployeeId: receipt.customerServiceEmployeeId ?? '',
      overseasCsEmployeeId: receipt.overseasCsEmployeeId ?? '',
      operationsEmployeeId: receipt.operationsEmployeeId ?? '',
      documentationEmployeeId: receipt.documentationEmployeeId ?? '',
      financeEmployeeId: receipt.financeEmployeeId ?? '',
      bookingEmployeeId: receipt.bookingEmployeeId ?? '',
      reviewerEmployeeId: receipt.reviewerEmployeeId ?? '',
      // Contact information - parties (stored in DB)
      shipperId: receipt.shipperId ?? '',
      bookingAgentId: receipt.bookingAgentId ?? '',
      customsAgentId: receipt.customsAgentId ?? '',
      // MBL port information (will be loaded from query)
      portOfDestinationId: '',
      portOfDischargeId: '',
      portOfLoadingId: '',
      placeOfReceiptId: '',
    },
  });

  const isDirty = form.formState.isDirty;
  const isSaving =
    updateMutation.isPending ||
    createMblMutation.isPending ||
    updateMblMutation.isPending ||
    createHblMutation.isPending ||
    updateHblMutation.isPending;

  useEffect(() => {
    const nextMblNo = mblQuery.data?.mblNo ?? '';
    const current = form.getValues('mblNo') ?? '';
    if (nextMblNo !== current) {
      form.setValue('mblNo', nextMblNo, { shouldDirty: false });
    }
  }, [mblQuery.data?.mblNo, form]);

  useEffect(() => {
    const nextSoNo = mblQuery.data?.soNo ?? '';
    const current = form.getValues('soNo') ?? '';
    if (nextSoNo !== current) {
      form.setValue('soNo', nextSoNo, { shouldDirty: false });
    }
  }, [mblQuery.data?.soNo, form]);

  useEffect(() => {
    const nextHblNo = hblQuery.data?.hblNo ?? '';
    const current = form.getValues('hblNo') ?? '';
    if (nextHblNo !== current) {
      form.setValue('hblNo', nextHblNo, { shouldDirty: false });
    }
  }, [hblQuery.data?.hblNo, form]);

  // Sync MBL port information from query
  useEffect(() => {
    if (mblQuery.data) {
      const updates: Record<string, any> = {};

      const nextPortOfDestinationId = mblQuery.data.portOfDestinationId ?? '';
      const currentPortOfDestinationId =
        form.getValues('portOfDestinationId') ?? '';
      if (nextPortOfDestinationId !== currentPortOfDestinationId) {
        updates.portOfDestinationId = nextPortOfDestinationId;
      }

      const nextPortOfDischargeId = mblQuery.data.portOfDischargeId ?? '';
      const currentPortOfDischargeId =
        form.getValues('portOfDischargeId') ?? '';
      if (nextPortOfDischargeId !== currentPortOfDischargeId) {
        updates.portOfDischargeId = nextPortOfDischargeId;
      }

      const nextPortOfLoadingId = mblQuery.data.portOfLoadingId ?? '';
      const currentPortOfLoadingId = form.getValues('portOfLoadingId') ?? '';
      if (nextPortOfLoadingId !== currentPortOfLoadingId) {
        updates.portOfLoadingId = nextPortOfLoadingId;
      }

      const nextPlaceOfReceiptId = mblQuery.data.placeOfReceiptId ?? '';
      const currentPlaceOfReceiptId = form.getValues('placeOfReceiptId') ?? '';
      if (nextPlaceOfReceiptId !== currentPlaceOfReceiptId) {
        updates.placeOfReceiptId = nextPlaceOfReceiptId;
      }

      if (Object.keys(updates).length > 0) {
        Object.entries(updates).forEach(([key, value]) => {
          form.setValue(key as any, value, { shouldDirty: false });
        });
      }
    }
  }, [mblQuery.data, form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async (data: ReceiptFormData) => {
    try {
      const payload: Record<string, any> = {};

      if (data.customerId !== (receipt.customerId ?? '')) {
        payload.customerId = data.customerId || undefined;
      }
      if (
        data.customsDeclarationType !== (receipt.customsDeclarationType ?? '')
      ) {
        payload.customsDeclarationType =
          data.customsDeclarationType || undefined;
      }
      if (data.inboundTime !== formatDateTimeLocalValue(receipt.inboundTime)) {
        payload.inboundTime = data.inboundTime;
      }
      if (data.remarks !== (receipt.remarks ?? '')) {
        payload.remarks = data.remarks;
      }
      if (data.internalRemarks !== (receipt.internalRemarks ?? '')) {
        payload.internalRemarks = data.internalRemarks;
      }

      // Contact information (nullable - allow clearing)
      const nextShipperId = (data.shipperId ?? '').trim();
      const prevShipperId = (receipt.shipperId ?? '').trim();
      if (nextShipperId !== prevShipperId) {
        payload.shipperId = nextShipperId || null;
      }

      const nextBookingAgentId = (data.bookingAgentId ?? '').trim();
      const prevBookingAgentId = (receipt.bookingAgentId ?? '').trim();
      if (nextBookingAgentId !== prevBookingAgentId) {
        payload.bookingAgentId = nextBookingAgentId || null;
      }

      const nextCustomsAgentId = (data.customsAgentId ?? '').trim();
      const prevCustomsAgentId = (receipt.customsAgentId ?? '').trim();
      if (nextCustomsAgentId !== prevCustomsAgentId) {
        payload.customsAgentId = nextCustomsAgentId || null;
      }

      // Employee assignments (nullable - allow clearing)
      const nextSalesEmployeeId = (data.salesEmployeeId ?? '').trim();
      const prevSalesEmployeeId = (receipt.salesEmployeeId ?? '').trim();
      if (nextSalesEmployeeId !== prevSalesEmployeeId) {
        payload.salesEmployeeId = nextSalesEmployeeId || null;
      }

      const nextCustomerServiceEmployeeId = (
        data.customerServiceEmployeeId ?? ''
      ).trim();
      const prevCustomerServiceEmployeeId = (
        receipt.customerServiceEmployeeId ?? ''
      ).trim();
      if (nextCustomerServiceEmployeeId !== prevCustomerServiceEmployeeId) {
        payload.customerServiceEmployeeId =
          nextCustomerServiceEmployeeId || null;
      }

      const nextOverseasCsEmployeeId = (data.overseasCsEmployeeId ?? '').trim();
      const prevOverseasCsEmployeeId = (
        receipt.overseasCsEmployeeId ?? ''
      ).trim();
      if (nextOverseasCsEmployeeId !== prevOverseasCsEmployeeId) {
        payload.overseasCsEmployeeId = nextOverseasCsEmployeeId || null;
      }

      const nextOperationsEmployeeId = (data.operationsEmployeeId ?? '').trim();
      const prevOperationsEmployeeId = (
        receipt.operationsEmployeeId ?? ''
      ).trim();
      if (nextOperationsEmployeeId !== prevOperationsEmployeeId) {
        payload.operationsEmployeeId = nextOperationsEmployeeId || null;
      }

      const nextDocumentationEmployeeId = (
        data.documentationEmployeeId ?? ''
      ).trim();
      const prevDocumentationEmployeeId = (
        receipt.documentationEmployeeId ?? ''
      ).trim();
      if (nextDocumentationEmployeeId !== prevDocumentationEmployeeId) {
        payload.documentationEmployeeId = nextDocumentationEmployeeId || null;
      }

      const nextFinanceEmployeeId = (data.financeEmployeeId ?? '').trim();
      const prevFinanceEmployeeId = (receipt.financeEmployeeId ?? '').trim();
      if (nextFinanceEmployeeId !== prevFinanceEmployeeId) {
        payload.financeEmployeeId = nextFinanceEmployeeId || null;
      }

      const nextBookingEmployeeId = (data.bookingEmployeeId ?? '').trim();
      const prevBookingEmployeeId = (receipt.bookingEmployeeId ?? '').trim();
      if (nextBookingEmployeeId !== prevBookingEmployeeId) {
        payload.bookingEmployeeId = nextBookingEmployeeId || null;
      }

      const nextReviewerEmployeeId = (data.reviewerEmployeeId ?? '').trim();
      const prevReviewerEmployeeId = (receipt.reviewerEmployeeId ?? '').trim();
      if (nextReviewerEmployeeId !== prevReviewerEmployeeId) {
        payload.reviewerEmployeeId = nextReviewerEmployeeId || null;
      }

      const nextMblNo = (data.mblNo ?? '').trim();
      const prevMblNo = (mblQuery.data?.mblNo ?? '').trim();
      const hasMblNoChange = nextMblNo !== prevMblNo;

      const nextSoNo = (data.soNo ?? '').trim();
      const prevSoNo = (mblQuery.data?.soNo ?? '').trim();
      const hasSoNoChange = nextSoNo !== prevSoNo;

      const nextHblNo = (data.hblNo ?? '').trim();
      const prevHblNo = (hblQuery.data?.hblNo ?? '').trim();
      const hasHblNoChange = nextHblNo !== prevHblNo;

      // Transport schedule (nullable - allow clearing)
      const nextAirCarrier = (data.airCarrier ?? '').trim();
      const prevAirCarrier = (receipt.airCarrier ?? '').trim();
      if (nextAirCarrier !== prevAirCarrier) {
        payload.airCarrier = nextAirCarrier || null;
      }

      const nextAirFlightNo = (data.airFlightNo ?? '').trim();
      const prevAirFlightNo = (receipt.airFlightNo ?? '').trim();
      if (nextAirFlightNo !== prevAirFlightNo) {
        payload.airFlightNo = nextAirFlightNo || null;
      }

      const nextAirFlightDate = (data.airFlightDate ?? '').trim();
      const prevAirFlightDate = (receipt.airFlightDate ?? '').trim();
      if (nextAirFlightDate !== prevAirFlightDate) {
        payload.airFlightDate = nextAirFlightDate || null;
      }

      const nextAirArrivalDateE = (data.airArrivalDateE ?? '').trim();
      const prevAirArrivalDateE = (receipt.airArrivalDateE ?? '').trim();
      if (nextAirArrivalDateE !== prevAirArrivalDateE) {
        payload.airArrivalDateE = nextAirArrivalDateE || null;
      }

      const nextAirOperationLocation = (data.airOperationLocation ?? '').trim();
      const prevAirOperationLocation = (
        receipt.airOperationLocation ?? ''
      ).trim();
      if (nextAirOperationLocation !== prevAirOperationLocation) {
        payload.airOperationLocation = nextAirOperationLocation || null;
      }

      const nextAirOperationNode = (data.airOperationNode ?? '').trim();
      const prevAirOperationNode = (receipt.airOperationNode ?? '').trim();
      if (nextAirOperationNode !== prevAirOperationNode) {
        payload.airOperationNode = nextAirOperationNode || null;
      }

      const nextSeaCarrierRoute = (data.seaCarrierRoute ?? '').trim();
      const prevSeaCarrierRoute = (receipt.seaCarrierRoute ?? '').trim();
      if (nextSeaCarrierRoute !== prevSeaCarrierRoute) {
        payload.seaCarrierRoute = nextSeaCarrierRoute || null;
      }

      const nextSeaVesselVoyage = (data.seaVesselVoyage ?? '').trim();
      const prevSeaVesselVoyage = (receipt.seaVesselVoyage ?? '').trim();
      if (nextSeaVesselVoyage !== prevSeaVesselVoyage) {
        payload.seaVesselVoyage = nextSeaVesselVoyage || null;
      }

      const nextSeaEtdE = (data.seaEtdE ?? '').trim();
      const prevSeaEtdE = (receipt.seaEtdE ?? '').trim();
      if (nextSeaEtdE !== prevSeaEtdE) {
        payload.seaEtdE = nextSeaEtdE || null;
      }

      const nextSeaEtaE = (data.seaEtaE ?? '').trim();
      const prevSeaEtaE = (receipt.seaEtaE ?? '').trim();
      if (nextSeaEtaE !== prevSeaEtaE) {
        payload.seaEtaE = nextSeaEtaE || null;
      }

      // Build comprehensive MBL patch with all fields
      const mblPatch: Partial<{
        mblNo: string | null;
        soNo: string | null;
        portOfDestinationId?: string;
        portOfDischargeId?: string;
        portOfLoadingId?: string;
        placeOfReceiptId?: string;
      }> = {};

      if (hasMblNoChange) {
        mblPatch.mblNo = nextMblNo || null;
      }
      if (hasSoNoChange) {
        mblPatch.soNo = nextSoNo || null;
      }

      // Check for MBL port changes
      const nextPortOfDestinationId = (data.portOfDestinationId ?? '').trim();
      const prevPortOfDestinationId = (
        mblQuery.data?.portOfDestinationId ?? ''
      ).trim();
      if (nextPortOfDestinationId !== prevPortOfDestinationId) {
        mblPatch.portOfDestinationId = nextPortOfDestinationId || undefined;
      }

      const nextPortOfDischargeId = (data.portOfDischargeId ?? '').trim();
      const prevPortOfDischargeId = (
        mblQuery.data?.portOfDischargeId ?? ''
      ).trim();
      if (nextPortOfDischargeId !== prevPortOfDischargeId) {
        mblPatch.portOfDischargeId = nextPortOfDischargeId || undefined;
      }

      const nextPortOfLoadingId = (data.portOfLoadingId ?? '').trim();
      const prevPortOfLoadingId = (mblQuery.data?.portOfLoadingId ?? '').trim();
      if (nextPortOfLoadingId !== prevPortOfLoadingId) {
        mblPatch.portOfLoadingId = nextPortOfLoadingId || undefined;
      }

      const nextPlaceOfReceiptId = (data.placeOfReceiptId ?? '').trim();
      const prevPlaceOfReceiptId = (
        mblQuery.data?.placeOfReceiptId ?? ''
      ).trim();
      if (nextPlaceOfReceiptId !== prevPlaceOfReceiptId) {
        mblPatch.placeOfReceiptId = nextPlaceOfReceiptId || undefined;
      }

      if (
        Object.keys(payload).length === 0 &&
        Object.keys(mblPatch).length === 0 &&
        !hasHblNoChange
      ) {
        toast.info('没有需要保存的更改');
        return;
      }

      if (Object.keys(payload).length > 0) {
        await updateMutation.mutateAsync(payload);
      }

      // MBL: merge all changes into a single request to avoid multiple concurrent requests
      if (Object.keys(mblPatch).length > 0) {
        if (mblQuery.data) {
          await updateMblMutation.mutateAsync(mblPatch);
        } else {
          // Create payload must not include nulls or undefined for ports
          const createPayload: Partial<{
            mblNo?: string;
            soNo?: string;
            portOfDestinationId?: string;
            portOfDischargeId?: string;
            portOfLoadingId?: string;
            placeOfReceiptId?: string;
          }> = {};
          if (typeof mblPatch.mblNo === 'string' && mblPatch.mblNo.trim()) {
            createPayload.mblNo = mblPatch.mblNo;
          }
          if (typeof mblPatch.soNo === 'string' && mblPatch.soNo.trim()) {
            createPayload.soNo = mblPatch.soNo;
          }
          if (mblPatch.portOfDestinationId) {
            createPayload.portOfDestinationId = mblPatch.portOfDestinationId;
          }
          if (mblPatch.portOfDischargeId) {
            createPayload.portOfDischargeId = mblPatch.portOfDischargeId;
          }
          if (mblPatch.portOfLoadingId) {
            createPayload.portOfLoadingId = mblPatch.portOfLoadingId;
          }
          if (mblPatch.placeOfReceiptId) {
            createPayload.placeOfReceiptId = mblPatch.placeOfReceiptId;
          }

          if (Object.keys(createPayload).length > 0) {
            await createMblMutation.mutateAsync(createPayload);
          }
        }
      }

      if (hasHblNoChange) {
        const hblNo = nextHblNo || null;
        if (hblQuery.data) {
          await updateHblMutation.mutateAsync({ hblNo });
        } else if (hblNo) {
          await createHblMutation.mutateAsync({ hblNo });
        }
      }

      toast.success(t('receiptActions.updateSuccess'));
      form.reset({
        ...data,
        mblNo: nextMblNo,
        soNo: nextSoNo,
        hblNo: nextHblNo,
      });
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          {isDirty && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="size-3" />
              有未保存的更改
            </div>
          )}
        </div>

        <Button type="submit" disabled={isSaving || !isDirty} size="sm">
          <Save className="mr-2 size-4" />
          {isSaving ? tCommon('saving') : tCommon('save')}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              {t('receiptActions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,360px)_minmax(0,360px)_minmax(0,1fr)]">
        {/* 左侧：基本信息表单 */}
        <FreightSection
          title={t('receipt.fields.receiptNo')}
          className="min-w-0"
        >
          <div className="space-y-4">
            {/* 入库单号（只读） */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t('receipt.fields.receiptNo')}
              </Label>
              <div className="text-lg font-semibold">
                {receipt.receiptNo}
                {mblQuery.data?.soNo ? (
                  <span className="ml-2 text-base font-medium text-muted-foreground">
                    / SO {mblQuery.data.soNo}
                  </span>
                ) : null}
              </div>
            </div>

            {/* SO No */}
            <div className="space-y-2">
              <Label htmlFor="soNo">SO号</Label>
              <Input
                id="soNo"
                placeholder="请输入SO号"
                {...form.register('soNo')}
              />
            </div>

            {/* MBL No */}
            <div className="space-y-2">
              <Label htmlFor="mblNo">{t('receipt.fields.mblNo')}</Label>
              <Input
                id="mblNo"
                placeholder={t('receipt.fields.mblNoPlaceholder')}
                {...form.register('mblNo')}
              />
            </div>

            {/* HBL No */}
            <div className="space-y-2">
              <Label htmlFor="hblNo">{t('receipt.fields.hblNo')}</Label>
              <Input
                id="hblNo"
                placeholder={t('receipt.fields.hblNoPlaceholder')}
                {...form.register('hblNo')}
              />
            </div>

            {/* 运输类型（创建时已确定，仅展示） */}
            <div className="space-y-2">
              <Label className="text-sm">{t('transportType.label')}</Label>
              <div className="text-sm text-muted-foreground">
                {receipt.transportType
                  ? t(`transportType.options.${receipt.transportType}` as any)
                  : '-'}
              </div>
            </div>

            {/* 报关类型 */}
            <div className="space-y-2">
              <Label htmlFor="customsDeclarationType">
                {t('customsDeclarationType.label')}
              </Label>
              <Select
                value={form.watch('customsDeclarationType')}
                onValueChange={(value) =>
                  form.setValue('customsDeclarationType', value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="customsDeclarationType">
                  <SelectValue
                    placeholder={t('customsDeclarationType.placeholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {t(`customsDeclarationType.options.${ct}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 入库时间 */}
            <div className="space-y-2">
              <Label htmlFor="inboundTime">
                {t('inboundTime')}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="inboundTime"
                type="datetime-local"
                {...form.register('inboundTime')}
              />
              {form.formState.errors.inboundTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.inboundTime.message}
                </p>
              )}
            </div>
          </div>
        </FreightSection>

        {/* 中间：航班/船期（随保存写入数据库） */}
        <FreightSection
          title={
            receipt.transportType === 'AIR_FREIGHT'
              ? t('transportSchedule.air.title')
              : t('transportSchedule.sea.title')
          }
          className="min-w-0"
        >
          <ReceiptTransportScheduleSection
            transportType={receipt.transportType ?? null}
            form={form as any}
          />
        </FreightSection>

        {/* 右侧：汇总 + 商品明细表格 */}
        <div className="grid min-w-0 gap-4 lg:col-span-2 xl:col-span-1 2xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <FreightSection title={tSummaryPanel('title')}>
            <ReceiptSummaryPanel
              items={items}
              transportType={receipt.transportType ?? null}
            />
          </FreightSection>

          <FreightTableSection
            title={t('itemsList.title')}
            icon={Package}
            actions={
              <Button onClick={onAddItem} size="sm" type="button">
                <Plus className="mr-2 size-4" />
                {t('items.create')}
              </Button>
            }
          >
            <Table className="min-w-[980px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[240px]">
                    {t('items.columns.commodity')}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {t('items.columns.sku')}
                  </TableHead>
                  <TableHead className="w-[96px] text-right">
                    {t('items.columns.initialQty')}
                  </TableHead>
                  <TableHead className="w-[96px]">
                    {t('items.columns.unit')}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {t('items.columns.location')}
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    {t('items.fields.weightPerUnit')}
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    {t('items.fields.volumePerUnit')}
                  </TableHead>
                  <TableHead className="w-[72px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <TableRow key={`sk-${idx}`} className="h-14">
                      {Array.from({ length: 8 }).map((__, cIdx) => (
                        <TableCell key={`sk-${idx}-${cIdx}`}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : itemsQuery.error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>{t('items.error')}</EmptyTitle>
                          <EmptyDescription>
                            {getFreightApiErrorMessage(itemsQuery.error)}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : renderedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>{t('items.empty')}</EmptyTitle>
                          <EmptyDescription>
                            {t('items.emptyHint')}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  renderedItems.map((item) => {
                    const weightPerUnit =
                      item.weightPerUnit != null
                        ? Number(item.weightPerUnit)
                        : undefined;
                    const totalWeightKg =
                      weightPerUnit != null && Number.isFinite(weightPerUnit)
                        ? weightPerUnit * item.initialQty
                        : undefined;

                    const lengthCm =
                      item.lengthCm != null ? Number(item.lengthCm) : undefined;
                    const widthCm =
                      item.widthCm != null ? Number(item.widthCm) : undefined;
                    const heightCm =
                      item.heightCm != null ? Number(item.heightCm) : undefined;
                    const volumePerUnitM3 =
                      lengthCm != null &&
                      widthCm != null &&
                      heightCm != null &&
                      Number.isFinite(lengthCm) &&
                      Number.isFinite(widthCm) &&
                      Number.isFinite(heightCm)
                        ? (lengthCm * widthCm * heightCm) / 1_000_000
                        : undefined;
                    const volumePerUnitScaled =
                      volumePerUnitM3 != null &&
                      Number.isFinite(volumePerUnitM3)
                        ? ceilToScaledInt(volumePerUnitM3, 2)
                        : undefined;
                    const totalVolumeScaled =
                      volumePerUnitScaled != null
                        ? volumePerUnitScaled * item.initialQty
                        : undefined;

                    return (
                      <TableRow key={item.id} className="h-14">
                        <TableCell className="max-w-[240px] truncate font-medium">
                          {item.commodityName ?? '-'}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">
                          {item.skuCode ?? '-'}
                        </TableCell>
                        <TableCell className="w-[96px] text-right tabular-nums font-medium">
                          {item.initialQty}
                        </TableCell>
                        <TableCell className="w-[96px] text-muted-foreground">
                          {item.unit ?? '-'}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">
                          {item.binLocation ?? '-'}
                        </TableCell>
                        <TableCell className="w-[120px] text-right tabular-nums text-muted-foreground">
                          {weightPerUnit != null &&
                          Number.isFinite(weightPerUnit) &&
                          totalWeightKg != null ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full cursor-help text-right tabular-nums">
                                  {formatCeilFixed(weightPerUnit, 3)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={6}
                                className="max-w-[320px]"
                              >
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {t('items.columns.totalWeight')}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t('items.columns.totalWeight')} ={' '}
                                    {t('items.fields.weightPerUnit')} ×{' '}
                                    {t('items.columns.initialQty')}
                                  </div>
                                  <div className="font-mono tabular-nums">
                                    {formatCeilFixed(weightPerUnit, 3)} ×{' '}
                                    {item.initialQty} ={' '}
                                    {formatCeilFixed(totalWeightKg, 2)}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="w-[120px] text-right tabular-nums text-muted-foreground">
                          {volumePerUnitScaled != null &&
                          totalVolumeScaled != null ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full cursor-help text-right tabular-nums">
                                  {formatScaledInt(volumePerUnitScaled, 2)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={6}
                                className="max-w-[360px]"
                              >
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {t('items.columns.totalVolume')}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t('items.fields.volumePerUnit')} = L × W ×
                                    H ÷ 1,000,000
                                  </div>
                                  <div className="font-mono tabular-nums">
                                    {formatCeilFixed(lengthCm ?? 0, 2)} ×{' '}
                                    {formatCeilFixed(widthCm ?? 0, 2)} ×{' '}
                                    {formatCeilFixed(heightCm ?? 0, 2)} ÷
                                    1,000,000 ={' '}
                                    {formatScaledInt(volumePerUnitScaled, 2)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t('items.columns.totalVolume')} ={' '}
                                    {t('items.fields.volumePerUnit')} ×{' '}
                                    {t('items.columns.initialQty')}
                                  </div>
                                  <div className="font-mono tabular-nums">
                                    {formatScaledInt(volumePerUnitScaled, 2)} ×{' '}
                                    {item.initialQty} ={' '}
                                    {formatScaledInt(totalVolumeScaled, 2)}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                type="button"
                              >
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onEditItem(item)}
                              >
                                <Edit className="mr-2 size-4" />
                                {t('itemActions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteItem(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                {t('itemActions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </FreightTableSection>
        </div>
      </div>

      {/* 备注区域 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internalRemarks">{t('internalRemarks')}</Label>
          <Textarea
            id="internalRemarks"
            {...form.register('internalRemarks')}
            placeholder={t('receipt.fields.internalRemarksPlaceholder')}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remarks">{t('remarks')}</Label>
          <Textarea
            id="remarks"
            {...form.register('remarks')}
            placeholder={t('receipt.fields.remarksPlaceholder')}
            rows={3}
          />
        </div>
      </div>

      {/* Tab区域：基本信息 */}
      <Tabs defaultValue="basic" className="space-y-3">
        <TabsList>
          <TabsTrigger value="basic">{t('detailTabs.basic')}</TabsTrigger>
          <TabsTrigger value="fees">{t('detailTabs.fees')}</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {/* 左侧：内部资料 */}
            <EmployeeAssignmentsSection
              salesEmployeeId={form.watch('salesEmployeeId')}
              customerServiceEmployeeId={form.watch(
                'customerServiceEmployeeId'
              )}
              overseasCsEmployeeId={form.watch('overseasCsEmployeeId')}
              operationsEmployeeId={form.watch('operationsEmployeeId')}
              documentationEmployeeId={form.watch('documentationEmployeeId')}
              financeEmployeeId={form.watch('financeEmployeeId')}
              bookingEmployeeId={form.watch('bookingEmployeeId')}
              reviewerEmployeeId={form.watch('reviewerEmployeeId')}
              onSalesEmployeeChange={(value) =>
                form.setValue('salesEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onCustomerServiceEmployeeChange={(value) =>
                form.setValue('customerServiceEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onOverseasCsEmployeeChange={(value) =>
                form.setValue('overseasCsEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onOperationsEmployeeChange={(value) =>
                form.setValue('operationsEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onDocumentationEmployeeChange={(value) =>
                form.setValue('documentationEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onFinanceEmployeeChange={(value) =>
                form.setValue('financeEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onBookingEmployeeChange={(value) =>
                form.setValue('bookingEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onReviewerEmployeeChange={(value) =>
                form.setValue('reviewerEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
            />

            {/* 中间：联系资料 */}
            <FreightSection title={t('detailSections.contact')}>
              <div className="grid gap-4">
                {/* 客户选择 */}
                <div className="space-y-2">
                  <Label htmlFor="customerId">{t('customer')}</Label>
                  <CustomerCombobox
                    value={form.watch('customerId')}
                    onValueChange={(value) =>
                      form.setValue('customerId', value, { shouldDirty: true })
                    }
                    onAddNew={() => setAddCustomerDialogOpen(true)}
                    placeholder={t('selectCustomer')}
                  />
                </div>

                {/* 发货人 */}
                <div className="space-y-2">
                  <Label htmlFor="shipperId">{t('shipper')}</Label>
                  <ShipperCombobox
                    value={form.watch('shipperId')}
                    onValueChange={(value) =>
                      form.setValue('shipperId', value, { shouldDirty: true })
                    }
                    placeholder={t('selectShipper')}
                  />
                </div>

                {/* 订舱代理 */}
                <div className="space-y-2">
                  <Label htmlFor="bookingAgentId">{t('bookingAgent')}</Label>
                  <BookingAgentCombobox
                    value={form.watch('bookingAgentId')}
                    onValueChange={(value) =>
                      form.setValue('bookingAgentId', value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder={t('selectBookingAgent')}
                  />
                </div>

                {/* 清关代理 */}
                <div className="space-y-2">
                  <Label htmlFor="customsAgentId">{t('customsAgent')}</Label>
                  <CustomsAgentCombobox
                    value={form.watch('customsAgentId')}
                    onValueChange={(value) =>
                      form.setValue('customsAgentId', value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder={t('selectCustomsAgent')}
                  />
                </div>
              </div>
            </FreightSection>

            {/* 右侧：提单信息 */}
            <FreightSection title={tMbl('title')} className="min-w-0">
              <div className="grid gap-4">
                {/* 目的港 */}
                <div className="space-y-2">
                  <Label htmlFor="portOfDestinationId">
                    {tMbl('portOfDestination')}
                  </Label>
                  <Controller
                    control={form.control}
                    name="portOfDestinationId"
                    render={({ field }) => (
                      <PortCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tMbl('portOfDestinationPlaceholder')}
                      />
                    )}
                  />
                </div>

                {/* 卸货港 */}
                <div className="space-y-2">
                  <Label htmlFor="portOfDischargeId">
                    {tMbl('portOfDischarge')}
                  </Label>
                  <Controller
                    control={form.control}
                    name="portOfDischargeId"
                    render={({ field }) => (
                      <PortCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tMbl('portOfDischargePlaceholder')}
                      />
                    )}
                  />
                </div>

                {/* 起运港 */}
                <div className="space-y-2">
                  <Label htmlFor="portOfLoadingId">
                    {tMbl('portOfLoading')}
                  </Label>
                  <Controller
                    control={form.control}
                    name="portOfLoadingId"
                    render={({ field }) => (
                      <PortCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tMbl('portOfLoadingPlaceholder')}
                      />
                    )}
                  />
                </div>

                {/* 收货地 */}
                <div className="space-y-2">
                  <Label htmlFor="placeOfReceiptId">
                    {tMbl('placeOfReceipt')}
                  </Label>
                  <Controller
                    control={form.control}
                    name="placeOfReceiptId"
                    render={({ field }) => (
                      <PortCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={tMbl('placeOfReceiptPlaceholder')}
                      />
                    )}
                  />
                </div>
              </div>
            </FreightSection>
          </div>
        </TabsContent>
        <TabsContent value="fees">
          <ReceiptFeeManagementTab receiptId={receipt.id} />
        </TabsContent>
      </Tabs>

      {/* 底部固定保存按钮 */}
      <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end">
        <Button type="submit" disabled={isSaving || !isDirty} size="lg">
          <Save className="mr-2 size-4" />
          {isSaving ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={addCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onSuccess={(customerId) => {
          form.setValue('customerId', customerId, { shouldDirty: true });
        }}
      />
    </form>
  );
}
