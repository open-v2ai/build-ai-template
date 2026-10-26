'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Calendar, MessageSquare, User } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Chat } from '@/app/[locale]/types'

interface DeleteChatConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chat: Chat
  onConfirm: () => Promise<void>
}

/**
 * 删除对话确认弹框组件
 * 
 * 功能:
 * - 提供删除对话的确认弹框界面
 * - 显示警告信息和对话详细统计信息
 * - 支持确认和取消操作
 * - 集成加载状态处理
 * 
 * @param open - 弹框是否打开
 * @param onOpenChange - 弹框状态变化回调
 * @param chat - 要删除的对话对象
 * @param onConfirm - 确认删除回调函数
 */
export default function DeleteChatConfirmDialog({
  open,
  onOpenChange,
  chat,
  onConfirm
}: DeleteChatConfirmDialogProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)

  // 处理确认删除操作
  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Delete chat failed:', error)
      // 错误处理由父组件负责显示
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('chat.actions.deleteChat')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2 space-y-4">
          {/* 对话标题 */}
          <div className="bg-muted p-3 rounded-md">
            <p className="font-medium text-foreground break-words">
              {chat.title}
            </p>
          </div>
          
          {/* 对话统计信息 */}
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-3">
              {/* 创建时间 */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t('chat.createdAt')}
                  </span>
                  <span className="text-sm font-medium">
                    {format(new Date(chat.created_at), 'yyyy/MM/dd HH:mm')}
                  </span>
                </div>
              </div>
              
              {/* 对话轮次 */}
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t('chat.conversationRounds')}
                  </span>
                  <span className="text-sm font-medium">
                    {chat.messages?.filter(msg => msg.role === 'user').length || 0} {t('chat.rounds')}
                  </span>
                </div>
              </div>
              
              {/* AI 助手 */}
              {chat.agent && (
                <div className="flex items-center gap-2 col-span-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {t('chat.agent')}
                    </span>
                    <span className="text-sm font-medium">
                      {chat.agent.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 警告信息 */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              <strong>{t('common.warning')}:</strong> {t('chat.actions.deleteWarning')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('common.actions.deleting') : t('common.actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
