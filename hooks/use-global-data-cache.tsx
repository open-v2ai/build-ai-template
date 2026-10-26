'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { fetcher } from '@/util/fetcher'
import type { Chat, Message, Agent } from '@/app/[locale]/types'

/**
 * 全局数据缓存接口
 */
interface GlobalDataCache {
  /** 聊天列表缓存 */
  chats: Chat[] | null
  /** 聊天列表加载状态 */
  chatsLoading: boolean
  /** 是否还有更多聊天记录 */
  hasMoreChats: boolean
  /** 获取聊天列表 */
  fetchChats: (loadMore?: boolean, includeMessages?: boolean) => Promise<Chat[]>
  /** 刷新聊天列表 */
  refreshChats: () => Promise<Chat[]>
  /** 添加新聊天到缓存 */
  addChatToCache: (chat: Chat) => void
  /** 更新缓存中的聊天 */
  updateChatInCache: (chatId: number, updates: Partial<Chat>) => void
  /** 向指定聊天添加新消息 */
  addMessageToChat: (chatId: number, message: Message) => void
  /** 更新指定聊天中的消息 */
  updateMessageInChat: (chatId: number, messageId: number, updates: Partial<Message>) => void
  /** 从缓存中删除指定聊天 */
  removeChatFromCache: (chatId: number) => void
  /** 获取单个聊天详情（带缓存） */
  getChatById: (chatId: number) => Promise<Chat | null>
  /** 活跃的 Agent 列表缓存 */
  agents: Agent[] | null
  /** Agent 列表加载状态 */
  agentsLoading: boolean
  /** 获取活跃的 Agent 列表 */
  fetchAgents: () => Promise<Agent[]>
}

/**
 * 全局数据缓存 Context
 */
const GlobalDataCacheContext = createContext<GlobalDataCache | undefined>(undefined)

/**
 * 全局数据缓存 Provider 组件
 * 
 * 功能:
 * - 缓存聊天列表数据，避免重复请求
 * - 提供统一的数据获取接口
 * - 管理数据的更新和同步
 * 
 * @param children - 子组件
 */
export function GlobalDataCacheProvider({ children }: { children: ReactNode }) {
  // 聊天列表缓存
  const [chats, setChats] = useState<Chat[] | null>(null)
  const [chatsLoading, setChatsLoading] = useState(false)
  const [hasMoreChats, setHasMoreChats] = useState(true)
  
  // 聊天详情缓存
  const [chatDetailsCache, setChatDetailsCache] = useState<Map<number, Chat>>(new Map())
  
  // 正在获取的聊天 ID 集合，防止重复请求
  const [fetchingChatIds, setFetchingChatIds] = useState<Set<number>>(new Set())
  
  // 获取开始时间记录，用于检测超时
  const [fetchingStartTimes, setFetchingStartTimes] = useState<Map<number, number>>(new Map())
  
  // Agent 列表缓存
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [agentsLoading, setAgentsLoading] = useState(false)

  // 定期清理超时的获取请求
  React.useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 30000 // 30秒超时
      
      setFetchingStartTimes(prev => {
        const newMap = new Map(prev)
        const timeoutIds: number[] = []
        
        prev.forEach((startTime, chatId) => {
          if (now - startTime > timeout) {
            timeoutIds.push(chatId)
          }
        })
        
        // 清理超时的请求
        timeoutIds.forEach(chatId => {
          newMap.delete(chatId)
        })
        
        return newMap
      })
      
      // 同时清理对应的获取标记
      if (fetchingStartTimes.size > 0) {
        setFetchingChatIds(prev => {
          const newSet = new Set(prev)
          let cleaned = false
          
          fetchingStartTimes.forEach((startTime, chatId) => {
            if (now - startTime > timeout && newSet.has(chatId)) {
              newSet.delete(chatId)
              cleaned = true
            }
          })
          
          return cleaned ? newSet : prev
        })
      }
    }, 10000) // 每10秒检查一次
    
    return () => clearInterval(cleanupInterval)
  }, [fetchingStartTimes])

  /**
   * 获取聊天列表（支持分页加载）
   * 
   * @param loadMore - 是否加载更多数据
   * @param includeMessages - 是否包含消息数据，默认true（一次性加载完整数据）
   */
  const fetchChats = useCallback(async (loadMore: boolean = false, includeMessages: boolean = true): Promise<Chat[]> => {
    // 防止重复加载
    if (chatsLoading) {
      return chats || []
    }

    // 如果有缓存且不是加载更多，直接返回
    if (chats && !loadMore) {
      return chats
    }

    // 如果是加载更多但没有更多数据
    if (loadMore && !hasMoreChats) {
      return chats || []
    }

    setChatsLoading(true)
    try {
      const currentCount = loadMore ? (chats?.length || 0) : 0
      const limit = 20
      const offset = currentCount
      
      // 构建请求URL，包含 include_messages 参数
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        include_messages: includeMessages.toString()
      })
      
      const res = await fetcher(`/chat?${params.toString()}`, {
        method: 'GET',
        auth: true,
      })
      const newChatList = res as Chat[]
      
      // 如果返回的数据少于请求的数量，说明没有更多数据了
      const hasMore = newChatList.length >= limit
      setHasMoreChats(hasMore)
      
      let finalChatList: Chat[]
      if (loadMore && chats) {
        // 加载更多时，合并到现有列表
        finalChatList = [...chats, ...newChatList]
      } else {
        // 首次加载或刷新时，替换整个列表
        finalChatList = newChatList
      }
      
      setChats(finalChatList)
      
      // 更新聊天详情缓存 - 优先使用包含消息的完整数据
      setChatDetailsCache(prev => {
        const newCache = new Map(prev)
        newChatList.forEach(chat => {
          const existingChat = newCache.get(chat.id)
          // 如果新数据包含消息，或者缓存中没有该聊天，则更新缓存
          if (chat.messages?.length || !existingChat) {
            newCache.set(chat.id, chat)
          }
        })
        return newCache
      })
      
      return finalChatList
    } catch (error) {
      throw error
    } finally {
      setChatsLoading(false)
    }
  }, [chats, chatsLoading, hasMoreChats])

  /**
   * 强制刷新聊天列表
   */
  const refreshChats = useCallback(async (): Promise<Chat[]> => {
    setChats(null) // 清除缓存
    setHasMoreChats(true) // 重置分页状态
    return fetchChats(false) // 重新加载第一页
  }, [fetchChats])

  /**
   * 添加新聊天到缓存
   */
  const addChatToCache = useCallback((chat: Chat) => {
    setChats(prev => prev ? [chat, ...prev] : [chat])
    setChatDetailsCache(prev => new Map(prev).set(chat.id, chat))
  }, [])

  /**
   * 更新缓存中的聊天
   */
  const updateChatInCache = useCallback((chatId: number, updates: Partial<Chat>) => {
    setChats(prev => {
      if (!prev) return prev
      return prev.map(chat => 
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    })
    
    setChatDetailsCache(prev => {
      const newCache = new Map(prev)
      const existingChat = newCache.get(chatId)
      if (existingChat) {
        newCache.set(chatId, { ...existingChat, ...updates })
      }
      return newCache
    })
  }, [])

  /**
   * 向指定聊天添加新消息（本地缓存更新）
   */
  const addMessageToChat = useCallback((chatId: number, message: Message) => {
    // 更新聊天列表缓存
    setChats(prev => {
      if (!prev) return prev
      return prev.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...(chat.messages || []), message]
          return {
            ...chat,
            messages: updatedMessages,
            updated_at: new Date().toISOString() // 更新时间戳
          }
        }
        return chat
      })
    })
    
    // 更新详情缓存
    setChatDetailsCache(prev => {
      const newCache = new Map(prev)
      const existingChat = newCache.get(chatId)
      if (existingChat) {
        const updatedMessages = [...(existingChat.messages || []), message]
        newCache.set(chatId, {
          ...existingChat,
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
      }
      return newCache
    })
  }, [])

  /**
   * 更新指定聊天中的消息（本地缓存更新）
   */
  const updateMessageInChat = useCallback((chatId: number, messageId: number, updates: Partial<Message>) => {
    const updateMessages = (messages: Message[]) => {
      return messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }

    // 更新聊天列表缓存
    setChats(prev => {
      if (!prev) return prev
      return prev.map(chat => {
        if (chat.id === chatId && chat.messages) {
          return {
            ...chat,
            messages: updateMessages(chat.messages),
            updated_at: new Date().toISOString()
          }
        }
        return chat
      })
    })
    
    // 更新详情缓存
    setChatDetailsCache(prev => {
      const newCache = new Map(prev)
      const existingChat = newCache.get(chatId)
      if (existingChat && existingChat.messages) {
        newCache.set(chatId, {
          ...existingChat,
          messages: updateMessages(existingChat.messages),
          updated_at: new Date().toISOString()
        })
      }
      return newCache
    })
  }, [])

  /**
   * 从缓存中删除指定聊天
   */
  const removeChatFromCache = useCallback((chatId: number) => {
    // 从聊天列表中移除
    setChats(prev => {
      if (!prev) return prev
      return prev.filter(chat => chat.id !== chatId)
    })
    
    // 从详情缓存中移除
    setChatDetailsCache(prev => {
      const newCache = new Map(prev)
      newCache.delete(chatId)
      return newCache
    })
  }, [])

  /**
   * 获取单个聊天详情（带缓存）
   * 优先使用包含完整消息数据的缓存，避免不必要的网络请求
   */
  const getChatById = useCallback(async (chatId: number): Promise<Chat | null> => {
    // 先检查详情缓存 - 优先返回包含消息的数据
    const cachedChat = chatDetailsCache.get(chatId)
    if (cachedChat && cachedChat.messages && cachedChat.messages.length > 0) {
      return cachedChat
    }

    // 检查聊天列表缓存 - 如果列表中已包含完整消息，直接使用
    if (chats) {
      const chatFromList = chats.find(chat => chat.id === chatId)
      if (chatFromList) {
        // 如果列表中的聊天包含消息数据，直接使用并更新详情缓存
        if (chatFromList.messages && chatFromList.messages.length > 0) {
          setChatDetailsCache(prev => new Map(prev).set(chatId, chatFromList))
          return chatFromList
        }
        // 如果列表中的聊天没有消息但有基本信息，也可以先返回
        // 但仍需要从服务器获取完整数据
      }
    }

    // 如果缓存中有基本信息但没有消息，且没有正在获取，则返回基本信息
    // 这样可以立即显示聊天界面，消息可以后续加载
    if (cachedChat && !fetchingChatIds.has(chatId)) {
      // 异步获取完整数据，但不阻塞当前返回
      setTimeout(async () => {
        try {
          const fullChat = await fetchChatFromServer(chatId)
          if (fullChat) {
            setChatDetailsCache(prev => new Map(prev).set(chatId, fullChat))
            // 更新聊天列表缓存
            setChats(prev => {
              if (!prev) return prev
              return prev.map(c => c.id === chatId ? { ...c, ...fullChat } : c)
            })
          }
        } catch (error) {
          // 静默处理错误，不影响用户体验
          console.warn('后台获取聊天详情失败:', error)
        }
      }, 0)
      
      return cachedChat
    }

    // 检查是否正在获取该聊天，避免重复请求
    if (fetchingChatIds.has(chatId)) {
      // 等待请求完成，但不要无限等待
      return new Promise((resolve) => {
        let attempts = 0
        const maxAttempts = 50 // 5秒超时 (50 * 100ms)
        
        const checkInterval = setInterval(() => {
          attempts++
          
          if (!fetchingChatIds.has(chatId)) {
            clearInterval(checkInterval)
            const updatedChat = chatDetailsCache.get(chatId)
            resolve(updatedChat || null)
            return
          }
          
          // 如果等待时间过长，放弃等待并尝试自己获取
          if (attempts >= maxAttempts) {
            clearInterval(checkInterval)
            
            // 清除获取标记，允许重新获取
            setFetchingChatIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(chatId)
              return newSet
            })
            
            // 递归调用自己，但这次不会进入等待逻辑
            resolve(getChatById(chatId))
          }
        }, 100)
      })
    }

    // 从服务器获取完整数据
    return await fetchChatFromServer(chatId)
  }, [chats, chatDetailsCache, fetchingChatIds])

  /**
   * 从服务器获取聊天数据的内部方法
   */
  const fetchChatFromServer = useCallback(async (chatId: number): Promise<Chat | null> => {
    // 标记正在获取
    const startTime = Date.now()
    setFetchingChatIds(prev => new Set(prev).add(chatId))
    setFetchingStartTimes(prev => new Map(prev).set(chatId, startTime))

    try {
      const res = await fetcher(`/chat/${chatId}`, {
        method: 'GET',
        auth: true,
      })
      const chat = res as Chat
      
      // 缓存完整的聊天数据
      setChatDetailsCache(prev => new Map(prev).set(chatId, chat))
      
      // 同时更新聊天列表缓存中的对应项
      setChats(prev => {
        if (!prev) return prev
        return prev.map(c => c.id === chatId ? { ...c, ...chat } : c)
      })
      
      return chat
    } catch (error) {
      // 检查是否是权限问题或聊天被删除
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setChatDetailsCache(prev => new Map(prev).set(chatId, null as any))
        }
      }
      
      return null
    } finally {
      // 确保在任何情况下都移除获取标记和时间记录
      setFetchingChatIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(chatId)
        return newSet
      })
      
      setFetchingStartTimes(prev => {
        const newMap = new Map(prev)
        newMap.delete(chatId)
        return newMap
      })
    }
  }, [])

  /**
   * 获取活跃的 Agent 列表（带缓存）
   */
  const fetchAgents = useCallback(async (): Promise<Agent[]> => {
    // 如果已有缓存且不在加载中，直接返回缓存
    if (agents && !agentsLoading) {
      return agents
    }

    // 如果正在加载，等待加载完成
    if (agentsLoading) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!agentsLoading && agents) {
            resolve(agents)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    setAgentsLoading(true)
    try {
      const res = await fetcher('/chat/agents/active', {
        method: 'GET',
        auth: true,
      })
      const agentsList = res as Agent[]
      
      // 按 ID 升序排序（最小 ID 优先）
      const sortedAgents = agentsList.sort((a, b) => a.id - b.id)
      setAgents(sortedAgents)
      
      return sortedAgents
    } catch {
      setAgents([])
      return []
    } finally {
      setAgentsLoading(false)
    }
  }, [agents, agentsLoading])

  const value: GlobalDataCache = {
    chats,
    chatsLoading,
    hasMoreChats,
    fetchChats,
    refreshChats,
    addChatToCache,
    updateChatInCache,
    addMessageToChat,
    updateMessageInChat,
    removeChatFromCache,
    getChatById,
    agents,
    agentsLoading,
    fetchAgents
  }


  return (
    <GlobalDataCacheContext.Provider value={value}>
      {children}
    </GlobalDataCacheContext.Provider>
  )
}

/**
 * 使用全局数据缓存的 Hook
 * 
 * @returns 全局数据缓存对象
 * @throws 如果在 Provider 外部使用会抛出错误
 */
export function useGlobalDataCache(): GlobalDataCache {
  const context = useContext(GlobalDataCacheContext)
  
  if (context === undefined) {
    throw new Error('useGlobalDataCache must be used within a GlobalDataCacheProvider')
  }
  
  return context
}
