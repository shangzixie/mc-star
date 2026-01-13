'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FreightInventoryItem } from '@/lib/freight/api-types';
import {
  ceilToScaledInt,
  formatCeilFixed,
  formatScaledInt,
} from '@/lib/freight/math';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function getDefaultDivisor(transportType: string | null | undefined): number {
  // Common industry defaults (cm-based divisor):
  // - Air: 6000  => 1 m³ ≈ 166.67 kg
  // - Sea: 1000  => 1 m³ = 1000 kg (W/M: 1 CBM == 1 TON)
  if (transportType === 'AIR_FREIGHT' || transportType === 'FBA_AIR')
    return 6000;
  if (
    transportType === 'SEA_FCL' ||
    transportType === 'SEA_LCL' ||
    transportType === 'FBA_SEA' ||
    transportType === 'BULK_CARGO'
  ) {
    return 1000;
  }
  return 6000;
}

type ManualBilling = {
  pieces: string;
  weightKg: string;
  volumeM3: string;
};

export function ReceiptSummaryPanel({
  items,
  transportType,
}: {
  items: FreightInventoryItem[];
  transportType?: string | null;
}) {
  const t = useTranslations('Dashboard.freight.inbound.summaryPanel');

  // Row 1: Settings
  const [divisorInput, setDivisorInput] = useState<string>(() =>
    String(getDefaultDivisor(transportType))
  );
  const [bubbleSplitPercentInput, setBubbleSplitPercentInput] =
    useState<string>('0');

  // Row 2: Pre-alert (manual only)
  const [prealertPieces, setPrealertPieces] = useState<string>('');
  const [prealertWeightKg, setPrealertWeightKg] = useState<string>('');
  const [prealertVolumeM3, setPrealertVolumeM3] = useState<string>('');
  const [prealertPackaging, setPrealertPackaging] = useState<string>('');

  // Row 4: Billing lock + manual override
  const [billingLocked, setBillingLocked] = useState(false);
  const [manualBilling, setManualBilling] = useState<ManualBilling>({
    pieces: '',
    weightKg: '',
    volumeM3: '',
  });

  // If transport type changes (new receipt, or user navigates), reset divisor default
  // only when user hasn't edited it (heuristic: equals previous default).
  useEffect(() => {
    const nextDefault = String(getDefaultDivisor(transportType));
    setDivisorInput((prev) => {
      const prevDefault = String(getDefaultDivisor(undefined));
      // If user hasn't interacted (still a "known default"), follow transportType.
      if (
        prev === '6000' ||
        prev === '5000' ||
        prev === '1000' ||
        prev === prevDefault
      ) {
        return nextDefault;
      }
      return prev;
    });
  }, [transportType]);

  const measured = useMemo(() => {
    let pieces = 0;
    let grossWeightKg = 0;
    let volumeCm3 = 0;
    let volumeM3Scaled = 0;

    for (const item of items) {
      const qty = Number(item.initialQty ?? 0);
      if (Number.isFinite(qty)) {
        pieces += qty;
      }

      const weightPerUnit =
        item.weightPerUnit != null ? Number(item.weightPerUnit) : null;
      if (weightPerUnit != null && Number.isFinite(weightPerUnit) && qty > 0) {
        grossWeightKg += weightPerUnit * qty;
      }

      const lengthCm = item.lengthCm != null ? Number(item.lengthCm) : null;
      const widthCm = item.widthCm != null ? Number(item.widthCm) : null;
      const heightCm = item.heightCm != null ? Number(item.heightCm) : null;
      if (
        lengthCm != null &&
        widthCm != null &&
        heightCm != null &&
        Number.isFinite(lengthCm) &&
        Number.isFinite(widthCm) &&
        Number.isFinite(heightCm) &&
        qty > 0
      ) {
        volumeCm3 += lengthCm * widthCm * heightCm * qty;

        // New rule: total volume = sum(ceil(unitVolumeM3, 2) * qty)
        const unitVolumeM3Raw = (lengthCm * widthCm * heightCm) / 1_000_000;
        const unitVolumeScaled = ceilToScaledInt(unitVolumeM3Raw, 2);
        if (Number.isFinite(unitVolumeScaled)) {
          volumeM3Scaled += unitVolumeScaled * qty;
        }
      }
    }

    return {
      pieces,
      grossWeightKg,
      volumeCm3,
      volumeM3Scaled,
      volumeM3: volumeM3Scaled / 100, // (m³ * 100) → m³
    };
  }, [items]);

  const divisor = useMemo(() => {
    // Divisor is in cm-based volumetric formula: kg = cm³ / divisor
    const n = parseNumber(divisorInput);
    return n != null && n > 0 ? n : 6000;
  }, [divisorInput]);

  const bubbleSplitRatio = useMemo(() => {
    // bubbleSplitPercent: 0~100. 50 means "split 50%" => charge + 50% of (VW - GW)
    const n = parseNumber(bubbleSplitPercentInput) ?? 0;
    return clampNumber(n, 0, 100) / 100;
  }, [bubbleSplitPercentInput]);

  const totalVolumetricWeightKg = useMemo(() => {
    // Total volumetric weight (kg)
    // - per piece formula: L(cm)*W(cm)*H(cm)/divisor
    // - total: Sum(cm³)/divisor
    return measured.volumeCm3 > 0 ? measured.volumeCm3 / divisor : 0;
  }, [measured.volumeCm3, divisor]);

  const computedBilling = useMemo(() => {
    const gw = measured.grossWeightKg;
    const vw = totalVolumetricWeightKg;
    let chargeableWeightKg = gw;

    if (vw > gw) {
      // Bubble (volumetric > gross):
      // chargeable = gw + (vw - gw) * (1 - bubbleSplit%)
      // Example: gw=100, vw=200, split=50% => 100 + 100*(1-0.5)=150
      chargeableWeightKg = gw + (vw - gw) * (1 - bubbleSplitRatio);
    }

    return {
      pieces: measured.pieces,
      weightKg: chargeableWeightKg,
      volumeM3: measured.volumeM3,
      grossWeightKg: gw,
      volumetricWeightKg: vw,
    };
  }, [measured, totalVolumetricWeightKg, bubbleSplitRatio]);

  // When user locks billing, snapshot current computed values into manual fields.
  useEffect(() => {
    if (!billingLocked) return;
    setManualBilling({
      pieces: String(computedBilling.pieces),
      weightKg: formatCeilFixed(computedBilling.weightKg, 2),
      volumeM3: formatScaledInt(measured.volumeM3Scaled, 2),
    });
  }, [billingLocked, computedBilling, measured.volumeM3Scaled]);

  const billingDisplay = billingLocked
    ? {
        pieces: manualBilling.pieces,
        weightKg: manualBilling.weightKg,
        volumeM3: manualBilling.volumeM3,
      }
    : {
        pieces: String(computedBilling.pieces),
        weightKg: formatCeilFixed(computedBilling.weightKg, 2),
        volumeM3: formatScaledInt(measured.volumeM3Scaled, 2),
      };

  return (
    <div className="rounded-md border text-sm">
      {/* Row 1: Settings */}
      <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:items-start">
        <div className="w-full pt-0 text-xs font-semibold text-muted-foreground sm:w-20 sm:pt-1">
          {t('rows.settings')}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.divisor')}
            </Label>
            <Input
              value={divisorInput}
              onChange={(e) => setDivisorInput(e.target.value)}
              inputMode="numeric"
              placeholder="6000"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.bubbleSplitPercent')}
            </Label>
            <Input
              value={bubbleSplitPercentInput}
              onChange={(e) => setBubbleSplitPercentInput(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.totalVolumetricWeight')}
            </Label>
            <Input
              value={formatCeilFixed(totalVolumetricWeightKg, 2)}
              readOnly
              className="h-7"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Pre-alert */}
      <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:items-start">
        <div className="w-full pt-0 text-xs font-semibold text-muted-foreground sm:w-20 sm:pt-1">
          {t('rows.prealert')}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-3 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.prealertPieces')}
            </Label>
            <Input
              value={prealertPieces}
              onChange={(e) => setPrealertPieces(e.target.value)}
              inputMode="numeric"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-3 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.prealertWeight')}
            </Label>
            <Input
              value={prealertWeightKg}
              onChange={(e) => setPrealertWeightKg(e.target.value)}
              inputMode="decimal"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-3 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.prealertVolume')}
            </Label>
            <Input
              value={prealertVolumeM3}
              onChange={(e) => setPrealertVolumeM3(e.target.value)}
              inputMode="decimal"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-3 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.packaging')}
            </Label>
            <Input
              value={prealertPackaging}
              onChange={(e) => setPrealertPackaging(e.target.value)}
              className="h-7"
              placeholder="CTNS"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Inbound / Measured */}
      <div className="flex flex-col gap-2 border-b p-2 sm:flex-row sm:items-start">
        <div className="w-full pt-0 text-xs font-semibold text-muted-foreground sm:w-20 sm:pt-1">
          {t('rows.measured')}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.measuredPieces')}
            </Label>
            <Input value={String(measured.pieces)} readOnly className="h-7" />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.measuredGrossWeight')}
            </Label>
            <Input
              value={formatCeilFixed(measured.grossWeightKg, 2)}
              readOnly
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.measuredVolume')}
            </Label>
            <Input
              value={formatScaledInt(measured.volumeM3Scaled, 2)}
              readOnly
              className="h-7"
            />
          </div>
        </div>
      </div>

      {/* Row 4: Chargeable / Billing */}
      <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-start">
        <div className="w-full pt-0 text-xs font-semibold text-muted-foreground sm:w-20 sm:pt-1">
          {t('rows.billing')}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.billingPieces')}
            </Label>
            <Input
              value={billingDisplay.pieces}
              onChange={(e) =>
                setManualBilling((prev) => ({
                  ...prev,
                  pieces: e.target.value,
                }))
              }
              readOnly={!billingLocked}
              inputMode="numeric"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <Label className="text-xs text-muted-foreground min-[480px]:truncate">
              {t('fields.billingWeight')}
            </Label>
            <Input
              value={billingDisplay.weightKg}
              onChange={(e) =>
                setManualBilling((prev) => ({
                  ...prev,
                  weightKg: e.target.value,
                }))
              }
              readOnly={!billingLocked}
              inputMode="decimal"
              className="h-7"
            />
          </div>
          <div className="grid min-w-0 gap-1 sm:col-span-6 lg:col-span-4 xl:col-span-12 min-[480px]:grid-cols-[84px_1fr] min-[480px]:items-center">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground min-[480px]:truncate">
                {t('fields.billingVolume')}
              </Label>
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={billingLocked}
                  onCheckedChange={(checked) =>
                    setBillingLocked(Boolean(checked))
                  }
                />
                {t('fields.lock')}
              </Label>
            </div>
            <Input
              value={billingDisplay.volumeM3}
              onChange={(e) =>
                setManualBilling((prev) => ({
                  ...prev,
                  volumeM3: e.target.value,
                }))
              }
              readOnly={!billingLocked}
              inputMode="decimal"
              className="h-7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
