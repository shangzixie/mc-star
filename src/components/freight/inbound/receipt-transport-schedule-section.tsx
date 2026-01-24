'use client';

import {
  AirlineCombobox,
  OceanCarrierCombobox,
} from '@/components/freight/shared/carrier-combobox';
import { WarehouseCombobox } from '@/components/freight/shared/warehouse-combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateFreightWarehouse,
  useFreightWarehouses,
} from '@/hooks/freight/use-freight-master-data';
import { RECEIPT_STATUSES } from '@/lib/freight/constants';
import { AIR_OPERATION_NODES } from '@/lib/freight/local-receipt-transport-schedule';
import { AlertCircle, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

export function ReceiptTransportScheduleSection({
  transportType,
  form,
}: {
  transportType: string | null | undefined;
  form: UseFormReturn<any>;
}) {
  const t = useTranslations(
    'Dashboard.freight.inbound.transportSchedule'
  ) as any;
  const { data: warehouses } = useFreightWarehouses({ q: '' });
  const createWarehouseMutation = useCreateFreightWarehouse();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [warehouseFormData, setWarehouseFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
    remarks: '',
  });

  const handleCreateWarehouse = async () => {
    const name = warehouseFormData.name.trim();
    if (!name) {
      toast.error(t('warehouseField.dialog.nameRequired' as any));
      return;
    }

    try {
      const created = await createWarehouseMutation.mutateAsync({
        name,
        address: warehouseFormData.address || undefined,
        contactPerson: warehouseFormData.contactPerson || undefined,
        phone: warehouseFormData.phone || undefined,
        remarks: warehouseFormData.remarks || undefined,
      });
      form.setValue('warehouseId', created.id, { shouldDirty: true });
      setWarehouseFormData({
        name: '',
        address: '',
        contactPerson: '',
        phone: '',
        remarks: '',
      });
      setWarehouseDialogOpen(false);
      toast.success(t('warehouseField.created' as any));
    } catch (error) {
      toast.error(t('warehouseField.dialog.createFailed' as any));
    }
  };

  const warehouseIdValue = form.watch('warehouseId') ?? '';

  // 验证：航班日期 < 到达日期
  const airDateValidation = useMemo(() => {
    const flightDate = form.watch('airFlightDate');
    const arrivalDate = form.watch('airArrivalDateE');
    if (flightDate && arrivalDate && flightDate > arrivalDate) {
      return t('air.validation.dateOrder');
    }
    return null;
  }, [form.watch('airFlightDate'), form.watch('airArrivalDateE'), t]);

  // 验证：离港日期 < 到港日期
  const seaDateValidation = useMemo(() => {
    const etd = form.watch('seaEtdE');
    const eta = form.watch('seaEtaE');
    if (etd && eta && etd > eta) {
      return t('sea.validation.dateOrder');
    }
    return null;
  }, [form.watch('seaEtdE'), form.watch('seaEtaE'), t]);

  const warehouseField = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouseId">{t('warehouseField.label')}</Label>
        <WarehouseCombobox
          value={warehouseIdValue || undefined}
          onValueChange={(value) =>
            form.setValue('warehouseId', value ?? '', { shouldDirty: true })
          }
          onAddNew={() => setWarehouseDialogOpen(true)}
          placeholder={t('warehouseField.placeholder')}
        />
        <Dialog
          open={warehouseDialogOpen}
          onOpenChange={setWarehouseDialogOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('warehouseField.dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('warehouseField.dialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* 库房名称 */}
              <div className="space-y-2">
                <Label htmlFor="wh-name">
                  {t('warehouseField.dialog.name')} *
                </Label>
                <Input
                  id="wh-name"
                  value={warehouseFormData.name}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder={t('warehouseField.dialog.namePlaceholder')}
                  autoFocus
                />
              </div>

              {/* 地址 */}
              <div className="space-y-2">
                <Label htmlFor="wh-address">
                  {t('warehouseField.dialog.address')}
                </Label>
                <Input
                  id="wh-address"
                  value={warehouseFormData.address}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      address: e.target.value,
                    })
                  }
                  placeholder={t('warehouseField.dialog.addressPlaceholder')}
                />
              </div>

              {/* 联系人 & 电话 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wh-contact">
                    {t('warehouseField.dialog.contact')}
                  </Label>
                  <Input
                    id="wh-contact"
                    value={warehouseFormData.contactPerson}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        contactPerson: e.target.value,
                      })
                    }
                    placeholder={t('warehouseField.dialog.contactPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-phone">
                    {t('warehouseField.dialog.phone')}
                  </Label>
                  <Input
                    id="wh-phone"
                    value={warehouseFormData.phone}
                    onChange={(e) =>
                      setWarehouseFormData({
                        ...warehouseFormData,
                        phone: e.target.value,
                      })
                    }
                    placeholder={t('warehouseField.dialog.phonePlaceholder')}
                  />
                </div>
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="wh-remarks">
                  {t('warehouseField.dialog.remarks')}
                </Label>
                <Textarea
                  id="wh-remarks"
                  value={warehouseFormData.remarks}
                  onChange={(e) =>
                    setWarehouseFormData({
                      ...warehouseFormData,
                      remarks: e.target.value,
                    })
                  }
                  placeholder={t('warehouseField.dialog.remarksPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setWarehouseDialogOpen(false)}
                type="button"
              >
                {t('warehouseField.dialog.cancel')}
              </Button>
              <Button
                onClick={handleCreateWarehouse}
                type="button"
                disabled={
                  createWarehouseMutation.isPending ||
                  !warehouseFormData.name.trim()
                }
              >
                {createWarehouseMutation.isPending
                  ? t('warehouseField.dialog.creating')
                  : t('warehouseField.dialog.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">{t('status.label')}</Label>
        <Select
          value={form.watch('status') ?? undefined}
          onValueChange={(value) =>
            form.setValue('status', value ?? '', {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger id="status">
            <SelectValue placeholder={t('status.label')} />
          </SelectTrigger>
          <SelectContent>
            {RECEIPT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status.toLowerCase()}` as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTransportContent = () => {
    if (transportType === 'AIR_FREIGHT') {
      return (
        <div className="space-y-4">
          {/* 航空公司 / 航班 */}
          <div className="space-y-2">
            <Label>{t('air.fields.carrierAndFlight')}</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_18px_1fr] sm:items-center">
              <AirlineCombobox
                value={form.watch('airCarrier') ?? undefined}
                onValueChange={(value) =>
                  form.setValue('airCarrier', value ?? '', {
                    shouldDirty: true,
                  })
                }
                placeholder={t('air.placeholders.carrier')}
              />
              <div className="hidden text-center text-muted-foreground sm:block">
                /
              </div>
              <Input
                placeholder={t('air.placeholders.flightNo')}
                {...form.register('airFlightNo')}
              />
            </div>
          </div>

          {/* 航班日期 & 到达日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="airFlightDate"
                className="flex items-center gap-1.5"
              >
                <Calendar className="size-4 text-blue-500" />
                {t('air.fields.flightDateE')}
              </Label>
              <Input
                id="airFlightDate"
                type="date"
                {...form.register('airFlightDate')}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="airArrivalDateE"
                className="flex items-center gap-1.5"
              >
                <Calendar className="size-4 text-green-500" />
                {t('air.fields.arrivalDateE')}
              </Label>
              <Input
                id="airArrivalDateE"
                type="date"
                {...form.register('airArrivalDateE')}
                className="text-base"
              />
            </div>
          </div>

          {/* 日期验证提示 */}
          {airDateValidation && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="size-4" />
              <AlertDescription>{airDateValidation}</AlertDescription>
            </Alert>
          )}

          {/* 操作地点 */}
          <div className="space-y-2">
            <Label htmlFor="airOperationLocation">
              {t('air.fields.operationLocation')}
            </Label>
            <Input
              id="airOperationLocation"
              placeholder={t('air.placeholders.operationLocation')}
              {...form.register('airOperationLocation')}
            />
          </div>

          {/* 操作节点 */}
          <div className="space-y-2">
            <Label htmlFor="airOperationNode">
              {t('air.fields.operationNode')}
            </Label>
            <Select
              value={form.watch('airOperationNode') ?? undefined}
              onValueChange={(value) =>
                form.setValue('airOperationNode', value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="airOperationNode">
                <SelectValue
                  placeholder={t('air.placeholders.operationNode')}
                />
              </SelectTrigger>
              <SelectContent>
                {AIR_OPERATION_NODES.map((node) => (
                  <SelectItem key={node} value={node}>
                    {t(`air.operationNodes.${node}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (transportType === 'SEA_FCL' || transportType === 'SEA_LCL') {
      return (
        <div className="space-y-4">
          {/* 承运人 / 航线 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seaCarrier">{t('sea.fields.carrier')}</Label>
              <OceanCarrierCombobox
                value={form.watch('seaCarrier') ?? undefined}
                onValueChange={(value) =>
                  form.setValue('seaCarrier', value ?? '', {
                    shouldDirty: true,
                  })
                }
                placeholder={t('sea.placeholders.carrier')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaRoute">{t('sea.fields.route')}</Label>
              <Input
                id="seaRoute"
                placeholder={t('sea.placeholders.route')}
                {...form.register('seaRoute')}
              />
            </div>
          </div>

          {/* 船名 / 航次 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seaVesselName">
                {t('sea.fields.vesselName')}
              </Label>
              <Input
                id="seaVesselName"
                placeholder={t('sea.placeholders.vesselName')}
                {...form.register('seaVesselName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaVoyage">{t('sea.fields.voyage')}</Label>
              <Input
                id="seaVoyage"
                placeholder={t('sea.placeholders.voyage')}
                {...form.register('seaVoyage')}
              />
            </div>
          </div>

          {/* 离港日期(E) & 到港日期(E) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="seaEtdE" className="flex items-center gap-1.5">
                <Calendar className="size-4 text-blue-500" />
                {t('sea.fields.etdE')}
              </Label>
              <Input
                id="seaEtdE"
                type="date"
                {...form.register('seaEtdE')}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seaEtaE" className="flex items-center gap-1.5">
                <Calendar className="size-4 text-green-500" />
                {t('sea.fields.etaE')}
              </Label>
              <Input
                id="seaEtaE"
                type="date"
                {...form.register('seaEtaE')}
                className="text-base"
              />
            </div>
          </div>

          {/* 日期验证提示 */}
          {seaDateValidation && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="size-4" />
              <AlertDescription>{seaDateValidation}</AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm text-muted-foreground">{t('unsupported')}</div>
    );
  };

  return (
    <div className="space-y-4">
      {renderTransportContent()}
      {warehouseField}
    </div>
  );
}
