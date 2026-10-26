import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from "next";
import "@/app/globals.css";
import { routing } from '@/i18n/routing';
import ThemeProvider from "@/components/theme-provider";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { GlobalChatStateProvider } from '@/hooks/use-global-chat-state';
import { GlobalDataCacheProvider } from '@/hooks/use-global-data-cache';
import { GlobalUserDataProvider } from '@/hooks/use-global-user-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/app/messages/${locale}.json`)).default;
  return {
    title: messages.HOME_PAGE_TITLE,
    description: messages.HOME_PAGE_DESCRIPTION,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemeProvider />
          <NextIntlClientProvider locale={locale}>
            <GlobalChatStateProvider>
              <GlobalUserDataProvider>
                <GlobalDataCacheProvider>
                  {children}
                </GlobalDataCacheProvider>
              </GlobalUserDataProvider>
            </GlobalChatStateProvider>
          </NextIntlClientProvider>
          <Toaster />
        </NextThemeProvider>
      </body>
    </html>
  );
}
