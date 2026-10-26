'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { 
  Package,
  Calendar, 
  CreditCard, 
  Eye, 
  Loader2,
  Search,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetcher } from '@/util/fetcher'
import { formatCurrency as formatCurrencyUtil } from '@/util/currency'
import OrderDetailDialog from '@/components/admin/order-detail-dialog'


// 订单列表项接口
interface OrderListItem {
  id: number
  order_number: string
  user_id: number
  user_email?: string  // 用户邮箱字段
  username?: string    // 用户名字段
  membership_plan_id: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed' | 'refunded'
  payment_method: 'stripe'
  final_price: number
  currency: string
  created_at: string
  paid_at?: string
}

// 订单搜索参数接口
interface OrderSearchParams {
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  status?: string
  user_id?: string
  user_email?: string
  username?: string
  order_number?: string
  start_date?: string
  end_date?: string
}

// 订单列表响应接口
interface OrderListResponse {
  orders: OrderListItem[]
  total: number
  total_pages: number
  current_page: number
  has_next: boolean
  has_prev: boolean
}

/**
 * 订单管理组件（管理员）
 * 
 * 功能:
 * - 管理所有用户订单
 * - 筛选和搜索订单
 * - 查看订单详情
 */
export default function OrdersManagementPage() {
  const t = useTranslations()
  
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false,
    has_prev: false,
  })
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({
    limit: 10,
    offset: 0,
    sort_by: 'created_at',
    sort_order: 'desc',
  })
  
  // 订单详情弹框状态
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)


  // 获取订单列表
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      // 添加搜索和筛选参数
      if (searchParams.status && searchParams.status !== 'all') params.append('status', searchParams.status)
      if (searchParams.user_id) params.append('user_id', searchParams.user_id)
      if (searchParams.user_email) params.append('user_email', searchParams.user_email)
      if (searchParams.username) params.append('username', searchParams.username)
      if (searchParams.order_number) params.append('order_number', searchParams.order_number)
      if (searchParams.start_date) params.append('start_date', searchParams.start_date)
      if (searchParams.end_date) params.append('end_date', searchParams.end_date)
      
      // 添加分页和排序参数
      params.append('limit', (searchParams.limit || 10).toString())
      params.append('offset', (searchParams.offset || 0).toString())
      if (searchParams.sort_by) params.append('sort_by', searchParams.sort_by)
      if (searchParams.sort_order) params.append('sort_order', searchParams.sort_order)
      
      
      const url = `/orders/admin/all${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetcher(url, {
        method: 'GET',
        auth: true,
      })
      
      const orderResponse = response as OrderListResponse
      setOrders(orderResponse.orders)
      setPaginationInfo({
        total: orderResponse.total,
        total_pages: orderResponse.total_pages,
        current_page: orderResponse.current_page,
        has_next: orderResponse.has_next,
        has_prev: orderResponse.has_prev,
      })
    } catch (error) {
      console.error('Fetch order list failed:', error)
      toast.error(t('order.messages.fetchFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, t])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ ...searchParams, offset: 0 })
  }

  // 获取订单状态徽章
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        text: t('order.status.pending')
      },
      processing: { 
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        text: t('order.status.processing')
      },
      completed: { 
        variant: 'secondary' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        text: t('order.status.completed')
      },
      cancelled: { 
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        text: t('order.status.cancelled')
      },
      failed: { 
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        text: t('order.status.failed')
      },
      refunded: { 
        variant: 'secondary' as const,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        text: t('order.status.refunded')
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    )
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // 格式化金额 - 使用订单中的货币信息
  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return formatCurrencyUtil(amount, currency)
  }

  // 处理查看订单详情
  const handleViewOrderDetail = (orderId: number) => {
    setSelectedOrderId(orderId)
    setIsDetailDialogOpen(true)
  }

  // 复制订单号到剪贴板
  const handleCopyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber)
      toast.success(t('admin.orders.messages.orderNumberCopied'))
    } catch (error) {
      console.error('Copy order number failed:', error)
      toast.error(t('admin.orders.messages.copyFailed'))
    }
  }

  return (
    <div className="p-6 max-w-full mx-auto overflow-x-hidden">
      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* 订单号搜索 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('order.table.orderNumber')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.orders.search.orderNumberPlaceholder')}
                  value={searchParams.order_number || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, order_number: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 用户名搜索 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.search.username')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.orders.search.usernamePlaceholder')}
                  value={searchParams.username || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 用户邮箱搜索 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.search.userEmail')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.orders.search.userEmailPlaceholder')}
                  value={searchParams.user_email || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, user_email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 用户ID搜索 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.filter.userId')}
              </label>
              <Input
                placeholder={t('admin.orders.filter.userIdPlaceholder')}
                value={searchParams.user_id || ''}
                onChange={(e) => setSearchParams({ ...searchParams, user_id: e.target.value })}
              />
            </div>

            {/* 订单状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('order.filter.status')}
              </label>
              <select
                value={searchParams.status || 'all'}
                onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="all">{t('order.filter.all')}</option>
                <option value="pending">{t('order.status.pending')}</option>
                <option value="processing">{t('order.status.processing')}</option>
                <option value="completed">{t('order.status.completed')}</option>
                <option value="cancelled">{t('order.status.cancelled')}</option>
                <option value="failed">{t('order.status.failed')}</option>
                <option value="refunded">{t('order.status.refunded')}</option>
              </select>
            </div>

            {/* 排序字段 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.sort.sortBy')}
              </label>
              <select
                value={searchParams.sort_by || 'created_at'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_by: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="created_at">{t('admin.orders.sort.fields.created_at')}</option>
                <option value="final_price">{t('admin.orders.sort.fields.final_price')}</option>
                <option value="status">{t('admin.orders.sort.fields.status')}</option>
                <option value="user_id">{t('admin.orders.sort.fields.user_id')}</option>
              </select>
            </div>

            {/* 排序方向 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.sort.sortOrder')}
              </label>
              <select
                value={searchParams.sort_order || 'desc'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_order: e.target.value as 'asc' | 'desc' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="desc">{t('admin.orders.sort.directions.desc')}</option>
                <option value="asc">{t('admin.orders.sort.directions.asc')}</option>
              </select>
            </div>

            {/* 开始日期 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.filter.startDate')}
              </label>
              <Input
                type="date"
                value={searchParams.start_date || ''}
                onChange={(e) => setSearchParams({ ...searchParams, start_date: e.target.value })}
              />
            </div>

            {/* 结束日期 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('admin.orders.filter.endDate')}
              </label>
              <Input
                type="date"
                value={searchParams.end_date || ''}
                onChange={(e) => setSearchParams({ ...searchParams, end_date: e.target.value })}
              />
            </div>

            {/* 搜索按钮 */}
            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('ui.search')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* 订单列表 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-muted-foreground">{t('common.actions.loading')}</span>
            <span className="text-sm text-muted-foreground mt-1">{t('admin.orders.loading.description')}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t('order.list.empty')}
            </h3>
            <p className="text-muted-foreground">
              {t('admin.orders.list.emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10 backdrop-blur-sm border-b border-purple-500/20">
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[200px]">
                    {t('order.table.orderNumber')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                    {t('admin.orders.table.userId')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[120px]">
                    {t('admin.orders.table.username')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[180px]">
                    {t('admin.orders.table.userEmail')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                    {t('order.table.status')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[120px]">
                    {t('order.table.amount')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">
                    {t('order.table.paymentMethod')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[160px]">
                    {t('order.table.createTime')}
                  </TableHead>
                  <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">
                    {t('order.table.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span className="select-all">
                          {order.order_number}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                          onClick={() => handleCopyOrderNumber(order.order_number)}
                          title={t('admin.orders.actions.copyOrderNumber')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.user_id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-32" title={order.username || t('common.values.notSet')}>
                        {order.username || t('common.values.notSet')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-48" title={order.user_email || t('common.values.notSet')}>
                        {order.user_email || t('common.values.notSet')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(order.final_price, order.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        Stripe
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrderDetail(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* 分页 */}
        {!isLoading && orders.length > 0 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setSearchParams({ 
                  ...searchParams, 
                  offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) 
                })}
                disabled={!paginationInfo.has_prev}
              >
                {t('pagination.previousPage')}
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                {t('common.pagination.pageInfo', { 
                  current: paginationInfo.current_page, 
                  total: paginationInfo.total_pages 
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchParams({ 
                  ...searchParams, 
                  offset: (searchParams.offset || 0) + (searchParams.limit || 10) 
                })}
                disabled={!paginationInfo.has_next}
              >
                {t('pagination.nextPage')}
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('common.pagination.showRecordsWithTotal', {
                    start: (searchParams.offset || 0) + 1,
                    end: (searchParams.offset || 0) + orders.length,
                    total: paginationInfo.total
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {t('common.pagination.pageInfo', { 
                    current: paginationInfo.current_page, 
                    total: paginationInfo.total_pages 
                  })}
                </span>
                <nav className="relative z-0 inline-flex rounded-md space-x-2">
                  <Button
                    className="shadow-sm"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchParams({ 
                      ...searchParams, 
                      offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) 
                    })}
                    disabled={!paginationInfo.has_prev}
                  >
                    {t('pagination.previousPage')}
                  </Button>
                  <Button
                    className="shadow-sm"
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchParams({ 
                      ...searchParams, 
                      offset: (searchParams.offset || 0) + (searchParams.limit || 10) 
                    })}
                    disabled={!paginationInfo.has_next}
                  >
                    {t('pagination.nextPage')}
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 订单详情弹框 */}
      <OrderDetailDialog
        orderId={selectedOrderId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </div>
  )
}
