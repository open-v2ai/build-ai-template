'use client';

import {usePathname, useRouter} from '@/i18n/navigation';
import {useLocale, useTranslations} from 'next-intl';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function LanguageSwitchButton() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const switchTo = locale === 'en' ? 'zh' : 'en';

  const handleSwitch = () => {
    setTimeout(() => {
      router.replace(pathname, {locale: switchTo});
    }, 300);
    toast.success(t('SWITCH_LANGUAGE_SUCCESS'));
  };
  
  return (
    <Button
      onClick={handleSwitch}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      title={locale === 'zh' ? t('SWITCH_TO_ENGLISH') : t('SWITCH_TO_CHINESE')}
    >
      <Languages className="w-5 h-5 text-neutral-500" />
    </Button>
  )
}