'use client';

import { EmployeeCombobox } from '@/components/freight/shared/employee-combobox';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

interface EmployeeAssignmentsSectionProps {
  salesEmployeeId?: string;
  customerServiceEmployeeId?: string;
  overseasCsEmployeeId?: string;
  operationsEmployeeId?: string;
  documentationEmployeeId?: string;
  financeEmployeeId?: string;
  bookingEmployeeId?: string;
  reviewerEmployeeId?: string;
  onSalesEmployeeChange: (value: string | undefined) => void;
  onCustomerServiceEmployeeChange: (value: string | undefined) => void;
  onOverseasCsEmployeeChange: (value: string | undefined) => void;
  onOperationsEmployeeChange: (value: string | undefined) => void;
  onDocumentationEmployeeChange: (value: string | undefined) => void;
  onFinanceEmployeeChange: (value: string | undefined) => void;
  onBookingEmployeeChange: (value: string | undefined) => void;
  onReviewerEmployeeChange: (value: string | undefined) => void;
}

export function EmployeeAssignmentsSection({
  salesEmployeeId,
  customerServiceEmployeeId,
  overseasCsEmployeeId,
  operationsEmployeeId,
  documentationEmployeeId,
  financeEmployeeId,
  bookingEmployeeId,
  reviewerEmployeeId,
  onSalesEmployeeChange,
  onCustomerServiceEmployeeChange,
  onOverseasCsEmployeeChange,
  onOperationsEmployeeChange,
  onDocumentationEmployeeChange,
  onFinanceEmployeeChange,
  onBookingEmployeeChange,
  onReviewerEmployeeChange,
}: EmployeeAssignmentsSectionProps) {
  const t = useTranslations('Dashboard.freight.inbound');

  return (
    <FreightSection title={t('employees.title')}>
      <div className="grid gap-4">
        {/* 业务员 - Sales */}
        <div className="space-y-2">
          <Label htmlFor="salesEmployee">{t('employees.roles.sales')}</Label>
          <EmployeeCombobox
            value={salesEmployeeId}
            onValueChange={onSalesEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 客服 - Customer Service */}
        <div className="space-y-2">
          <Label htmlFor="customerServiceEmployee">
            {t('employees.roles.customerService')}
          </Label>
          <EmployeeCombobox
            value={customerServiceEmployeeId}
            onValueChange={onCustomerServiceEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 海外客服 - Overseas Customer Service */}
        <div className="space-y-2">
          <Label htmlFor="overseasCsEmployee">
            {t('employees.roles.overseasCs')}
          </Label>
          <EmployeeCombobox
            value={overseasCsEmployeeId}
            onValueChange={onOverseasCsEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 操作 - Operations */}
        <div className="space-y-2">
          <Label htmlFor="operationsEmployee">
            {t('employees.roles.operations')}
          </Label>
          <EmployeeCombobox
            value={operationsEmployeeId}
            onValueChange={onOperationsEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 文件 - Documentation */}
        <div className="space-y-2">
          <Label htmlFor="documentationEmployee">
            {t('employees.roles.documentation')}
          </Label>
          <EmployeeCombobox
            value={documentationEmployeeId}
            onValueChange={onDocumentationEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 财务 - Finance */}
        <div className="space-y-2">
          <Label htmlFor="financeEmployee">
            {t('employees.roles.finance')}
          </Label>
          <EmployeeCombobox
            value={financeEmployeeId}
            onValueChange={onFinanceEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 订舱工作 - Booking */}
        <div className="space-y-2">
          <Label htmlFor="bookingEmployee">
            {t('employees.roles.booking')}
          </Label>
          <EmployeeCombobox
            value={bookingEmployeeId}
            onValueChange={onBookingEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>

        {/* 审核员 - Reviewer */}
        <div className="space-y-2">
          <Label htmlFor="reviewerEmployee">
            {t('employees.roles.reviewer')}
          </Label>
          <EmployeeCombobox
            value={reviewerEmployeeId}
            onValueChange={onReviewerEmployeeChange}
            placeholder={t('employees.selectEmployee')}
          />
        </div>
      </div>
    </FreightSection>
  );
}

