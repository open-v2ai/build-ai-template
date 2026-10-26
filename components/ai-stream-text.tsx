'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIStreamTextProps {
  /**
   * 流式文本内容
   */
  text: string
  /**
   * 是否正在流式接收
   */
  isLoading?: boolean
  /**
   * 打字机速度（毫秒每字符）
   */
  speed?: number
  /**
   * 是否启用打字机效果
   */
  enableTypewriter?: boolean
  /**
   * 额外的样式类
   */
  className?: string
  /**
   * 是否显示原始文本
   */
  showRaw?: boolean
  /**
   * 完成回调
   */
  onComplete?: () => void
  /**
   * 是否为历史消息（历史消息不使用打字机效果）
   */
  isHistoryMessage?: boolean
}

/**
 * AI 流式文本组件 - 基于 Vercel AI SDK 设计理念
 * 
 * 特性:
 * - 与 Vercel AI SDK 流式响应完美集成
 * - 使用 requestAnimationFrame 实现流畅动画
 * - 支持 Markdown 渲染和语法高亮
 * - 智能的流式状态检测
 * - 优化的性能和内存使用
 */
export default function AIStreamText({
  text,
  isLoading = false,
  speed = 30,
  enableTypewriter = true,
  className = '',
  showRaw = false,
  onComplete,
  isHistoryMessage = false
}: AIStreamTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | undefined>(undefined)
  const currentIndexRef = useRef(0)
  const targetTextRef = useRef('')
  const lastTimeRef = useRef(0)

  // 清理动画
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
  }, [])

  // 动画函数
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp
    }

    const elapsed = timestamp - lastTimeRef.current
    
    if (elapsed >= speed) {
      const currentIndex = currentIndexRef.current
      const targetText = targetTextRef.current
      
      if (currentIndex < targetText.length) {
        // 显示下一个字符
        currentIndexRef.current = currentIndex + 1
        setDisplayedText(targetText.slice(0, currentIndex + 1))
        lastTimeRef.current = timestamp
      } else if (!isLoading) {
        // 动画完成
        setIsAnimating(false)
        onComplete?.()
        return
      }
    }
    
    // 继续动画
    animationRef.current = requestAnimationFrame(animate)
  }, [speed, isLoading, onComplete])

  // 启动动画
  const startAnimation = useCallback(() => {
    // 禁用打字机效果时，直接显示完整文本
    if (!enableTypewriter) {
      setDisplayedText(text)
      return
    }

    // 如果是历史消息且不在加载状态，直接显示完整文本
    if (isHistoryMessage && !isLoading) {
      setDisplayedText(text)
      return
    }

    if (isAnimating) return

    setIsAnimating(true)
    currentIndexRef.current = 0
    targetTextRef.current = text
    lastTimeRef.current = 0
    setDisplayedText('')
    animationRef.current = requestAnimationFrame(animate)
  }, [enableTypewriter, text, isAnimating, animate, isHistoryMessage, isLoading])

  // 处理文本变化
  useEffect(() => {
    // 如果禁用打字机效果，直接显示
    if (!enableTypewriter) {
      setDisplayedText(text)
      return
    }

    // 历史消息时，直接显示完整文本
    if (isHistoryMessage) {
      setDisplayedText(text)
      cleanup()
      setIsAnimating(false)
      return
    }

    // 如果正在加载（流式输出中），处理流式逻辑
    if (isLoading) {
      targetTextRef.current = text
      
      // 如果动画未运行，启动动画
      if (!isAnimating) {
        startAnimation()
      }
      return
    }

    // 处理文本重置或完全改变的情况
    if (text !== targetTextRef.current) {
      cleanup()
      setIsAnimating(false)
      targetTextRef.current = text
      if (text) {
        startAnimation()
      }
    } else if (text && !isAnimating) {
      // 如果有文本内容且不在动画中，直接显示
      setDisplayedText(text)
    }
  }, [text, enableTypewriter, isAnimating, startAnimation, cleanup, isHistoryMessage, isLoading])

  // 处理加载状态变化
  useEffect(() => {
    if (!isLoading && currentIndexRef.current >= text.length && isAnimating) {
      // 流式结束，完成动画
      cleanup()
      setIsAnimating(false)
      onComplete?.()
    }
  }, [isLoading, text.length, isAnimating, onComplete, cleanup])

  // 初始化历史消息显示
  useEffect(() => {
    if (isHistoryMessage && text) {
      setDisplayedText(text)
      cleanup()
      setIsAnimating(false)
    }
  }, [isHistoryMessage, text, cleanup])

  // 清理
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 预处理文本
  const processedText = useMemo(() => {
    return displayedText.replace(/\n/g, '  \n')
  }, [displayedText])

  // 渲染内容
  const content = useMemo(() => {
    if (showRaw) {
      return (
        <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-3 rounded-lg border">
          {displayedText}
        </pre>
      )
    }

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p({ children, ...props }) {
              // 检查子元素中是否包含块级元素（如 pre, div 等），如果是则使用 div 而不是 p
              const hasBlockElements = React.Children.toArray(children).some(child => {
                if (React.isValidElement(child)) {
                  const tagName = typeof child.type === 'string' ? child.type : ''
                  // 检查是否为块级元素
                  return ['pre', 'div', 'blockquote', 'ul', 'ol', 'table'].includes(tagName)
                }
                return false
              })
              
              if (hasBlockElements) {
                return <div className="mb-2 last:mb-0" {...props}>{children}</div>
              }
              
              return <p className="mb-2 last:mb-0" {...props}>{children}</p>
            },
            pre({ children, ...props }) {
              return (
                <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-3 border" {...props}>
                  {children}
                </pre>
              )
            },
            code(props: { inline?: boolean; className?: string; children?: React.ReactNode }) {
              const { inline, className, children, ...restProps } = props
              if (inline) {
                return (
                  <code
                    className="bg-muted/70 px-1.5 py-0.5 rounded text-sm font-mono border"
                    {...restProps}
                  >
                    {children}
                  </code>
                )
              }
              // 对于代码块，只返回 code 元素，让 pre 组件处理外层
              return (
                <code className={`${className || ''} font-mono text-sm`} {...restProps}>
                  {children}
                </code>
              )
            },
            ul({ children, ...props }) {
              return <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>
            },
            ol({ children, ...props }) {
              return <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>
            },
            li({ children, ...props }) {
              return <li className="leading-relaxed" {...props}>{children}</li>
            },
            h1({ children, ...props }) {
              return <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0" {...props}>{children}</h1>
            },
            h2({ children, ...props }) {
              return <h2 className="text-lg font-semibold mt-3 mb-2 first:mt-0" {...props}>{children}</h2>
            },
            h3({ children, ...props }) {
              return <h3 className="text-base font-medium mt-2 mb-1 first:mt-0" {...props}>{children}</h3>
            },
            blockquote({ children, ...props }) {
              return (
                <blockquote 
                  className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic text-muted-foreground"
                  {...props}
                >
                  {children}
                </blockquote>
              )
            },
            table({ children, ...props }) {
              return (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full border-collapse border border-muted" {...props}>
                    {children}
                  </table>
                </div>
              )
            },
            th({ children, ...props }) {
              return (
                <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-medium" {...props}>
                  {children}
                </th>
              )
            },
            td({ children, ...props }) {
              return (
                <td className="border border-muted px-3 py-2" {...props}>
                  {children}
                </td>
              )
            }
          }}
        >
          {processedText}
        </ReactMarkdown>
      </div>
    )
  }, [processedText, showRaw, displayedText])

  return (
    <div className={`relative ${className}`}>
      {content}
      {/* 打字机光标 */}
      {enableTypewriter && !isHistoryMessage && (isAnimating || isLoading) && !showRaw && (
        <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  )
}
