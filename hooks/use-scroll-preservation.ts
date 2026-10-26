import { useRef, useEffect, useCallback } from 'react'

/**
 * 滚动位置保持 Hook
 * 
 * 功能:
 * - 自动保存滚动位置
 * - 在组件重新渲染后恢复滚动位置
 * - 防止意外的滚动重置
 * 
 * @param dependencies - 触发滚动位置恢复的依赖项数组
 * @returns 滚动容器引用和相关方法
 */
export function useScrollPreservation<T extends HTMLElement>(dependencies: React.DependencyList = []) {
  const scrollContainerRef = useRef<T>(null)
  const savedScrollPosition = useRef<number>(0)
  const isRestoringRef = useRef<boolean>(false)
  
  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && !isRestoringRef.current) {
      savedScrollPosition.current = scrollContainerRef.current.scrollTop
    }
  }, [])
  
  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && savedScrollPosition.current > 0) {
      isRestoringRef.current = true
      
      // 使用多重 requestAnimationFrame 确保 DOM 完全更新后再恢复
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedScrollPosition.current
            
            // 短暂延迟后重置标志，防止立即保存
            setTimeout(() => {
              isRestoringRef.current = false
            }, 100)
          }
        })
      })
    }
  }, [])
  
  // 强制保存当前滚动位置
  const forcePreservePosition = useCallback(() => {
    if (scrollContainerRef.current) {
      savedScrollPosition.current = scrollContainerRef.current.scrollTop
    }
  }, [])
  
  // 滚动到指定元素
  const scrollToElement = useCallback((selector: string, offset: number = 0) => {
    if (scrollContainerRef.current) {
      const targetElement = scrollContainerRef.current.querySelector(selector)
      if (targetElement) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect()
        const elementRect = targetElement.getBoundingClientRect()
        
        // 计算元素相对于容器的位置
        const elementTop = (targetElement as HTMLElement).offsetTop
        const targetScrollTop = Math.max(0, elementTop - offset)
        
        // 检查元素是否已经在视口顶部附近
        const isAlreadyAtTop = elementRect.top - containerRect.top <= offset + 20
        
        if (!isAlreadyAtTop) {
          // 使用平滑滚动
          scrollContainerRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
          
          // 更新保存的滚动位置
          savedScrollPosition.current = targetScrollTop
        }
      }
    }
  }, [])
  
  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      savedScrollPosition.current = 0
    }
  }, [])
  
  // 智能滚动到选中的元素
  const scrollToSelected = useCallback((selector: string, forcePosition: boolean = false) => {
    if (scrollContainerRef.current) {
      const targetElement = scrollContainerRef.current.querySelector(selector)
      if (targetElement) {
        const container = scrollContainerRef.current
        const containerRect = container.getBoundingClientRect()
        const elementRect = targetElement.getBoundingClientRect()
        
        // 计算元素相对于容器的位置
        const elementTop = (targetElement as HTMLElement).offsetTop
        const elementHeight = elementRect.height
        const containerHeight = containerRect.height
        const currentScrollTop = container.scrollTop
        
        // 检查元素是否在可视区域内
        const elementRelativeTop = elementRect.top - containerRect.top
        const elementRelativeBottom = elementRelativeTop + elementHeight
        
        // 定义可视区域的缓冲区（避免元素紧贴边缘）
        const topBuffer = 60  // 顶部缓冲区
        const bottomBuffer = 60  // 底部缓冲区
        
        let needScroll = false
        let targetScrollTop = currentScrollTop
        
        if (forcePosition) {
          // 强制滚动到第二个位置
          needScroll = true
          const previousElement = targetElement.previousElementSibling as HTMLElement
          if (previousElement) {
            const previousElementTop = previousElement.offsetTop
            targetScrollTop = Math.max(0, previousElementTop - 5)
          } else {
            targetScrollTop = 0
          }
        } else {
          // 智能滚动：只有当元素不在可视区域时才滚动
          // 如果元素在可视区域上方
          if (elementRelativeTop < topBuffer) {
            needScroll = true
            // 滚动到前一个元素的位置，让选中元素显示在第2个位置
            const previousElement = targetElement.previousElementSibling as HTMLElement
            if (previousElement) {
              const previousElementTop = previousElement.offsetTop
              targetScrollTop = Math.max(0, previousElementTop - 5)
            } else {
              targetScrollTop = 0
            }
          }
          // 如果元素在可视区域下方
          else if (elementRelativeBottom > containerHeight - bottomBuffer) {
            needScroll = true
            // 滚动使元素显示在容器底部附近
            targetScrollTop = Math.max(0, elementTop - containerHeight + elementHeight + bottomBuffer)
          }
        }
        
        // 执行滚动
        if (needScroll) {
          container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          })
          
          // 更新保存的滚动位置
          savedScrollPosition.current = targetScrollTop
        }
      }
    }
  }, [])
  
  // 监听依赖项变化，恢复滚动位置
  useEffect(() => {
    if (dependencies.length > 0) {
      restoreScrollPosition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
  
  // 创建滚动事件处理器
  const createScrollHandler = useCallback((originalHandler?: (event: Event) => void) => {
    return (event: Event) => {
      saveScrollPosition()
      originalHandler?.(event)
    }
  }, [saveScrollPosition])
  
  return {
    scrollContainerRef,
    saveScrollPosition,
    restoreScrollPosition,
    forcePreservePosition,
    scrollToElement,
    scrollToTop,
    scrollToSelected,
    createScrollHandler,
    savedPosition: savedScrollPosition.current
  }
}
