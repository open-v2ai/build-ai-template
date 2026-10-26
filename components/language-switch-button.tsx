'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Languages } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { usePathname, useRouter } from '@/i18n/navigation'

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
    toast.success(t('common.language.switchSuccess'));
  };
  
  return (
    <Button
      onClick={handleSwitch}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      title={locale === 'zh' ? t('common.language.switchToEnglish') : t('common.language.switchToChinese')}
    >
      <Languages className="w-5 h-5 text-foreground" />
    </Button>
  )
}