'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AdminSidebar } from "@/components/admin/sidebar/admin-sidebar"
import DashboardPage from '@/components/admin/dashboard-page'
import UsersManagementPage from '@/components/admin/users-management-page'
import ChatsManagementPage from '@/components/admin/chats-management-page'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { checkAdminAccess } from '@/util/auth';
import LanguageSwitchButton from "@/components/language-switch-button"
import ThemeToggleButton from "@/components/theme-toggle-button"

export default function AdminPage() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const { hasAccess, reason } = await checkAdminAccess();
      
      if (!hasAccess) {
        console.log('Access denied:', reason);
        router.push('/login');
        return;
      }

      // Passed all checks, show admin page
      setIsChecking(false);
    };

    verifyAdminAccess();
  }, [router]);

  // Show loading state while checking permissions
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('CHECKING_PERMISSIONS')}</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return t('DASHBOARD');
      case 'users':
        return t('USER_MANAGEMENT');
      case 'chats':
        return t('CHAT_MANAGEMENT');
      default:
        return t('DASHBOARD');
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UsersManagementPage />;
      case 'chats':
        return <ChatsManagementPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <SidebarInset className="overflow-x-hidden">
        <header className="sticky top-0 z-20 bg-background border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block text-lg">
                  <BreadcrumbLink href="#">
                    {getPageTitle()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto justify-end pr-4 flex items-center gap-2">
            <ThemeToggleButton />
            <LanguageSwitchButton />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 pt-0 overflow-x-hidden">
          <div className="bg-muted/50 min-h-[100vh] flex flex-1 rounded-xl md:min-h-min overflow-x-hidden">
            {renderCurrentPage()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
