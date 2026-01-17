'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AIR_OPERATION_NODES } from '@/lib/freight/local-receipt-transport-schedule';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

export function ReceiptTransportScheduleSection({
  transportType,
  form,
}: {
  transportType: string | null | undefined;
  form: UseFormReturn<any>;
}) {
  const t = useTranslations('Dashboard.freight.inbound.transportSchedule');

  if (transportType === 'AIR_FREIGHT') {
    return (
      <div className="space-y-3">
        {/* 航空公司 / 航班 */}
        <div className="space-y-2">
          <Label>{t('air.fields.carrierAndFlight')}</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_18px_1fr] sm:items-center">
            <Input
              placeholder={t('air.placeholders.carrier')}
              {...form.register('airCarrier')}
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

        {/* 航班日期(E) */}
        <div className="space-y-2">
          <Label htmlFor="airFlightDate">{t('air.fields.flightDateE')}</Label>
          <Input
            id="airFlightDate"
            type="date"
            {...form.register('airFlightDate')}
          />
        </div>

        {/* 到达日期(E) */}
        <div className="space-y-2">
          <Label htmlFor="airArrivalDateE">
            {t('air.fields.arrivalDateE')}
          </Label>
          <Input
            id="airArrivalDateE"
            type="date"
            {...form.register('airArrivalDateE')}
          />
        </div>

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
              <SelectValue placeholder={t('air.placeholders.operationNode')} />
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
      <div className="space-y-3">
        {/* 承运人 / 航线 */}
        <div className="space-y-2">
          <Label htmlFor="seaCarrierRoute">
            {t('sea.fields.carrierRoute')}
          </Label>
          <Input
            id="seaCarrierRoute"
            placeholder={t('sea.placeholders.carrierRoute')}
            {...form.register('seaCarrierRoute')}
          />
        </div>

        {/* 船名 / 航次 */}
        <div className="space-y-2">
          <Label htmlFor="seaVesselVoyage">
            {t('sea.fields.vesselVoyage')}
          </Label>
          <Input
            id="seaVesselVoyage"
            placeholder={t('sea.placeholders.vesselVoyage')}
            {...form.register('seaVesselVoyage')}
          />
        </div>

        {/* 离港日期(E) */}
        <div className="space-y-2">
          <Label htmlFor="seaEtdE">{t('sea.fields.etdE')}</Label>
          <Input id="seaEtdE" type="date" {...form.register('seaEtdE')} />
        </div>

        {/* 到港日期(E) */}
        <div className="space-y-2">
          <Label htmlFor="seaEtaE">{t('sea.fields.etaE')}</Label>
          <Input id="seaEtaE" type="date" {...form.register('seaEtaE')} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">{t('unsupported')}</div>
  );
}
