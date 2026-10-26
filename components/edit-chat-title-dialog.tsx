'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface EditChatTitleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string
  onSave: (newTitle: string) => Promise<void>
}

/**
 * 编辑对话标题弹框组件
 * 
 * 功能:
 * - 提供编辑对话标题的弹框界面
 * - 支持输入验证和保存操作
 * - 集成加载状态和错误处理
 * 
 * @param open - 弹框是否打开
 * @param onOpenChange - 弹框状态变化回调
 * @param currentTitle - 当前对话标题
 * @param onSave - 保存回调函数
 */
export default function EditChatTitleDialog({
  open,
  onOpenChange,
  currentTitle,
  onSave
}: EditChatTitleDialogProps) {
  const t = useTranslations()
  const [title, setTitle] = useState(currentTitle)
  const [isLoading, setIsLoading] = useState(false)

  // 当弹框打开时重置标题
  useEffect(() => {
    if (open) {
      setTitle(currentTitle)
    }
  }, [open, currentTitle])

  // 处理保存操作
  const handleSave = async () => {
    const trimmedTitle = title.trim()
    
    // 验证标题不能为空
    if (!trimmedTitle) {
      return
    }
    
    // 如果标题没有变化，直接关闭弹框
    if (trimmedTitle === currentTitle) {
      onOpenChange(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(trimmedTitle)
      onOpenChange(false)
    } catch (error) {
      console.error('Save chat title failed:', error)
      // 错误处理由父组件负责显示
    } finally {
      setIsLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('chat.actions.editTitle')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
              placeholder={t('chat.titlePlaceholder')}
              disabled={isLoading}
              autoFocus
            />
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
            onClick={handleSave}
            disabled={isLoading || !title.trim() || title.trim() === currentTitle}
          >
            {isLoading ? t('common.actions.saving') : t('common.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
