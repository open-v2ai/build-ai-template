import {routing} from '@/i18n/routing';
import type { Metadata } from "next";
import "@/app/globals.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/app/messages/${locale}.json`)).default;
  return {
    title: messages.LOGIN_PAGE_TITLE,
    description: messages.LOGIN_PAGE_DESCRIPTION,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  )
}
