import React, { useState, useEffect } from "react"
import { Shield, User as UserIcon } from "lucide-react"

/**
 * 格式化token数量，按千单位显示，使用进一法（不满1千算1千）
 */
export function formatTokenCount(count: number): string {
  if (count <= 0) {
    return '0'
  }
  // 使用进一法，不满1千的算1千
  const k = Math.ceil(count / 1000)
  return `${k}k`
}

export interface UserTypeUtils {
  getUserTypeIcon: (type: string) => React.ReactElement
  getUserTypeColor: (type: string) => string
  getUserTypeText: (type: string, t: (key: string) => string) => string
  isAdminUser: (userType: string) => boolean
}

// 用户类型图标
export const getUserTypeIcon = (type: string): React.ReactElement => {
  switch (type) {
    case 'admin':
      return <Shield className="w-2.5 h-2.5" />
    case 'user':
    default:
      return <UserIcon className="w-2.5 h-2.5" />
  }
}

// 用户类型颜色
export const getUserTypeColor = (type: string) => {
  switch (type) {
    case 'admin':
      return 'bg-purple-50 text-purple-400 dark:bg-purple-950 dark:text-purple-500'
    case 'user':
    default:
      return 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500'
  }
}

// 用户类型文本（主应用版本）
export const getUserTypeText = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'admin':
      return t('admin.users.filters.admin')
    case 'user':
    default:
      return t('admin.users.filters.user')
  }
}

// 用户类型文本（管理端版本）
export const getAdminUserTypeText = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'admin':
      return t('common.userTypes.admin')
    case 'user':
    default:
      return t('common.userTypes.user')
  }
}

// 检查是否为管理员
export const isAdminUser = (userType: string) => {
  return userType === 'admin'
}

// 会员等级文本
export const getMembershipLevelText = (level: string, t: (key: string) => string) => {
  switch (level) {
    case 'monthly':
      return t('membership.monthly')
    case 'yearly':
      return t('membership.yearly')
    case 'free':
      return t('membership.free')
    default:
      return t('membership.free')
  }
}

// 用户状态管理 Hook - 实时获取，不使用缓存
export const useUserStatus = (userEmail: string) => {
  const [userType, setUserType] = useState<string>('user')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkUserStatus = () => {
      const storedUserType = localStorage.getItem('user_type') || 'user'
      
      setUserType(storedUserType)
      setIsAdmin(isAdminUser(storedUserType))
    }

    if (userEmail) {
      checkUserStatus()
    }
    
    // 监听 localStorage 变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_type') {
        checkUserStatus()
      }
    }
    
    // 监听自定义事件
    const handleUserTypeChange = () => {
      checkUserStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-type-changed', handleUserTypeChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-type-changed', handleUserTypeChange)
    }
  }, [userEmail])

  return { userType, isAdmin }
}

// 通用登出函数
export const handleLogout = (router: { push: (path: string) => void }, t: (key: string) => string, toast: { success: (message: string) => void }) => {
  localStorage.removeItem('email')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_type')
  
  setTimeout(() => {
    router.push('/login')
  }, 1000)
  
  toast.success(t('auth.messages.logoutSuccess'))
}
