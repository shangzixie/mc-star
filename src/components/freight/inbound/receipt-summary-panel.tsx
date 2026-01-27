'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FreightInventoryItem } from '@/lib/freight/api-types';
import {
  ceilToScaledInt,
  formatCeilFixed,
  formatScaledInt,
} from '@/lib/freight/math';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

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

function getWeightConversionFactor(
  transportType: string | null | undefined
): number {
  // User-defined rule:
  // - Air: 6000
  // - Sea: 1000
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

export function ReceiptSummaryPanel({
  items,
  transportType,
  bubbleSplitPercentInput,
  piecesInput,
  weightInput,
  volumeInput,
  weightConversionFactorInput,
  onBubbleSplitPercentChange,
  onPiecesChange,
  onWeightChange,
  onVolumeChange,
  onWeightConversionFactorChange,
  disabled,
}: {
  items: FreightInventoryItem[];
  transportType?: string | null;
  bubbleSplitPercentInput: string;
  piecesInput: string;
  weightInput: string;
  volumeInput: string;
  weightConversionFactorInput: string;
  onBubbleSplitPercentChange: (value: string) => void;
  onPiecesChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onVolumeChange: (value: string) => void;
  onWeightConversionFactorChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('Dashboard.freight.inbound.summaryPanel');

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

  const defaultWeightConversionFactor = useMemo(() => {
    return getWeightConversionFactor(transportType);
  }, [transportType]);

  const weightConversionFactor = useMemo(() => {
    const manual = parseNumber(weightConversionFactorInput);
    return manual != null ? manual : defaultWeightConversionFactor;
  }, [weightConversionFactorInput, defaultWeightConversionFactor]);

  const bubbleSplitRatio = useMemo(() => {
    const n = parseNumber(bubbleSplitPercentInput) ?? 0;
    return clampNumber(n, 0, 100) / 100;
  }, [bubbleSplitPercentInput]);

  const manualPieces = useMemo(() => parseNumber(piecesInput), [piecesInput]);
  const manualWeightKg = useMemo(() => parseNumber(weightInput), [weightInput]);
  const manualVolumeM3 = useMemo(() => parseNumber(volumeInput), [volumeInput]);

  const effectivePieces =
    manualPieces != null ? Math.max(0, manualPieces) : measured.pieces;
  const effectiveWeightKg =
    manualWeightKg != null
      ? Math.max(0, manualWeightKg)
      : measured.grossWeightKg;
  const effectiveVolumeM3 =
    manualVolumeM3 != null ? Math.max(0, manualVolumeM3) : measured.volumeM3;

  const billingTons = useMemo(() => {
    const factor = weightConversionFactor > 0 ? weightConversionFactor : 1;
    return effectiveWeightKg > 0 ? effectiveWeightKg / factor : 0;
  }, [effectiveWeightKg, weightConversionFactor]);

  const settlementWeight = useMemo(() => {
    // 结算重 = max(体, (1 - 分泡) * 计费吨)
    // 计费吨 = 重 / 重量换算系数
    const adjustedBillingTons = (1 - bubbleSplitRatio) * billingTons;
    const volume = effectiveVolumeM3;
    return Math.max(volume, adjustedBillingTons);
  }, [effectiveVolumeM3, billingTons, bubbleSplitRatio]);

  const piecesDisplayValue = piecesInput.trim()
    ? piecesInput
    : String(measured.pieces);
  const weightDisplayValue = weightInput.trim()
    ? weightInput
    : formatCeilFixed(measured.grossWeightKg, 2);
  const volumeDisplayValue = volumeInput.trim()
    ? volumeInput
    : formatScaledInt(measured.volumeM3Scaled, 2);
  const weightConversionFactorDisplayValue = weightConversionFactorInput.trim()
    ? weightConversionFactorInput
    : String(defaultWeightConversionFactor);

  return (
    <div className="rounded-md border text-sm">
      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-3 border-b p-3 sm:grid-cols-3">
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.weightConversionFactor')}
          </Label>
          <Input
            value={weightConversionFactorDisplayValue}
            onChange={(e) => onWeightConversionFactorChange(e.target.value)}
            inputMode="decimal"
            placeholder={String(defaultWeightConversionFactor)}
            className="h-8"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.billingTons')}
          </Label>
          <Input
            value={formatCeilFixed(billingTons, 2)}
            readOnly
            className="h-8 shadow-inner bg-muted/50"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.bubbleSplitPercent')}
          </Label>
          <Input
            value={bubbleSplitPercentInput}
            onChange={(e) => onBubbleSplitPercentChange(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="h-8"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.pieces')}
          </Label>
          <Input
            value={piecesDisplayValue}
            onChange={(e) => onPiecesChange(e.target.value)}
            inputMode="numeric"
            placeholder={String(measured.pieces)}
            className="h-8"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.weight')}
          </Label>
          <Input
            value={weightDisplayValue}
            onChange={(e) => onWeightChange(e.target.value)}
            inputMode="decimal"
            placeholder={formatCeilFixed(measured.grossWeightKg, 2)}
            className="h-8"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.volume')}
          </Label>
          <Input
            value={volumeDisplayValue}
            onChange={(e) => onVolumeChange(e.target.value)}
            inputMode="decimal"
            placeholder={formatScaledInt(measured.volumeM3Scaled, 2)}
            className="h-8"
            disabled={disabled}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs text-muted-foreground">
            {t('fields.settlementWeight')}
          </Label>
          <Input
            value={formatCeilFixed(settlementWeight, 2)}
            readOnly
            className="h-8 shadow-inner bg-muted/50"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
