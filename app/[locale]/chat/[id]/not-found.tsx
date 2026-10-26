'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 聊天不存在页面
 * 
 * 功能:
 * - 显示聊天不存在的提示信息
 * - 提供返回主页的链接
 */
export default function ChatNotFound() {
  const t = useTranslations()

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">404</CardTitle>
          <CardDescription>
            {t('common.error.chatNotFound')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('common.error.chatNotFoundDescription')}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/">
                {t('common.error.backToHome')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                {t('common.error.startNewChat')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
