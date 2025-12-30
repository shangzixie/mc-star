import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import EmailButton from '@/mail/components/email-button';
import EmailLayout from '@/mail/components/email-layout';
import type { BaseEmailProps } from '@/mail/types';
import { Text } from '@react-email/components';
import { createTranslator } from 'use-intl/core';

interface InviteUserProps extends BaseEmailProps {
  inviteUrl: string;
  invitedBy: string;
}

export default function InviteUser({
  inviteUrl,
  invitedBy,
  locale,
  messages,
}: InviteUserProps) {
  const t = createTranslator({
    locale,
    messages,
    namespace: 'Mail.inviteUser',
  });

  return (
    <EmailLayout locale={locale} messages={messages}>
      <Text>{t('title', { invitedBy })}</Text>
      <Text>{t('body')}</Text>
      <EmailButton href={inviteUrl}>{t('acceptInvitation')}</EmailButton>
      <Text style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
        {t('expiryNote')}
      </Text>
    </EmailLayout>
  );
}

InviteUser.PreviewProps = {
  locale: routing.defaultLocale,
  messages: defaultMessages,
  inviteUrl: 'https://mksaas.com/auth/register?token=abc123',
  invitedBy: 'Admin',
};
