'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import { Search, Shield, UserX, User as UserIcon, Edit2, UserPlus, Trash2, RotateCcw, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CreateUserModal from '@/components/admin/create-user-modal'
import DeleteUserModal from '@/components/admin/delete-user-modal'
import { fetcher } from '@/util/fetcher'
import { formatDateTime } from '@/util/dateFormat'
import type { User, UserSearchParams, UserUpdateRequest, UserListResponse } from '@/app/[locale]/admin/types'

interface UserRowProps {
  user: User;
  onUpdate: (userId: number, updates: UserUpdateRequest) => void;
  onDelete: (user: User) => void;
  onCreate: () => void;
}

function UserRow({ user, onUpdate, onDelete, onCreate }: UserRowProps) {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserUpdateRequest>({
    username: user.username || '',
    user_type: user.user_type,
    membership_type: user.membership_type || 'free',
    is_deleted: user.is_deleted,
  });

  // Get user type translation key
  const getUserTypeTranslationKey = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'common.userTypes.admin';
      case 'user':
      default:
        return 'common.userTypes.user';
    }
  };

  const handleSave = () => {
    onUpdate(user.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      username: user.username || '',
      user_type: user.user_type,
      membership_type: user.membership_type || 'free',
      is_deleted: user.is_deleted,
    });
    setIsEditing(false);
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <Shield className="w-3 h-3 mr-1" />;
      case 'user':
      default:
        return <UserIcon className="w-3 h-3 mr-1" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'user':
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMembershipTypeColor = (membershipType: string | null) => {
    switch (membershipType) {
      case 'yearly':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'monthly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // 复制邮箱到剪贴板
  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      toast.success(t('admin.users.messages.emailCopied'))
    } catch (error) {
      console.error('Copy email failed:', error)
      toast.error(t('admin.users.messages.copyFailed'))
    }
  };

  return (
    <TableRow className={`hover:bg-muted/50 h-16 ${user.is_deleted ? 'opacity-60' : ''}`}>
      <TableCell className="text-sm text-foreground">{user.id}</TableCell>
      <TableCell className="text-sm text-foreground">
        {isEditing ? (
          <Input
            value={editData.username || ''}
            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            className="w-full"
            placeholder={t('common.placeholders.username')}
          />
        ) : (
          <div className="truncate max-w-32" title={user.username || t('common.values.notSet')}>
            {user.username || t('common.values.notSet')}
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm text-foreground">
        <div className="flex items-center gap-2">
          <span className="select-all">
            {user.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
            onClick={() => handleCopyEmail(user.email)}
            title={t('admin.users.actions.copyEmail')}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {isEditing ? (
          <select
            value={editData.user_type}
            onChange={(e) => setEditData({ ...editData, user_type: e.target.value as 'user' | 'admin' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="user">{t('admin.users.filters.user')}</option>
            <option value="admin">{t('admin.users.filters.admin')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
            {getUserTypeIcon(user.user_type)}
            <span className="truncate">{t(getUserTypeTranslationKey(user.user_type))}</span>
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {isEditing ? (
          <select
            value={editData.membership_type || 'free'}
            onChange={(e) => setEditData({ ...editData, membership_type: e.target.value as 'free' | 'monthly' | 'yearly' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="free">{t('admin.users.filters.freeMembership')}</option>
            <option value="monthly">{t('admin.users.filters.monthlyMembership')}</option>
            <option value="yearly">{t('admin.users.filters.yearlyMembership')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipTypeColor(user.membership_type)}`}>
            <span className="truncate">
              {user.membership_type ? t(`membership.${user.membership_type}`) : t('common.values.notSet')}
            </span>
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {isEditing ? (
          <select
            value={editData.is_deleted ? 'true' : 'false'}
            onChange={(e) => setEditData({ ...editData, is_deleted: e.target.value === 'true' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="false">{t('common.status.normal')}</option>
            <option value="true">{t('common.status.deleted')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_deleted
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
            {user.is_deleted ? (
              <><UserX className="w-3 h-3 mr-1" /> <span className="truncate">{t('common.status.deleted')}</span></>
            ) : (
              <span className="truncate">{t('common.status.normal')}</span>
            )}
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground w-32 text-center">{user.chat_count}</TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {user.last_login_at ? formatDateTime(user.last_login_at) : t('common.values.neverLoggedIn')}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {user.last_active ? formatDateTime(user.last_active) : t('common.values.neverActive')}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDateTime(user.created_at)}
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>{t('common.actions.save')}</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>{t('common.actions.cancel')}</Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                title={t('admin.users.editUser')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(user)}
                title={user.is_deleted ? t('admin.users.restoreUser') : t('admin.users.deleteUser')}
                className={user.is_deleted ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
              >
                {user.is_deleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreate}
                title={t('admin.users.createUser')}
                className="text-blue-600 hover:text-blue-700"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function UsersManagementPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    total_pages: 0,
    current_page: 1,
    has_next: false,
    has_prev: false,
  });
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    limit: 10,
    offset: 0,
    sort_by: 'id',
    sort_order: 'asc',
  });

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (searchParams.email) queryParams.append('email', searchParams.email);
      if (searchParams.username) queryParams.append('username', searchParams.username);
      if (searchParams.user_type) queryParams.append('user_type', searchParams.user_type);
      if (searchParams.membership_type) queryParams.append('membership_type', searchParams.membership_type);
      if (searchParams.is_deleted !== undefined) queryParams.append('is_deleted', searchParams.is_deleted.toString());
      queryParams.append('limit', (searchParams.limit || 10).toString());
      queryParams.append('offset', (searchParams.offset || 0).toString());
      if (searchParams.sort_by) queryParams.append('sort_by', searchParams.sort_by);
      if (searchParams.sort_order) queryParams.append('sort_order', searchParams.sort_order);

      const data = await fetcher(`/admin/users?${queryParams.toString()}`, {
        method: 'GET',
        auth: true,
      });

      const response = data as UserListResponse;
      setUsers(response.users);
      setPaginationInfo({
        total: response.total,
        total_pages: response.total_pages,
        current_page: response.current_page,
        has_next: response.has_next,
        has_prev: response.has_prev,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (userId: number, updates: UserUpdateRequest) => {
    try {
      await fetcher(`/admin/users/${userId}`, {
        method: 'PUT',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ ...searchParams, offset: 0 });
  };

  return (
    <div className="p-6 max-w-full mx-auto overflow-x-hidden">
      {/* 搜索和筛选 */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.userEmail')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('common.placeholders.searchEmail')}
                  value={searchParams.email || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.username')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.users.search.usernamePlaceholder')}
                  value={searchParams.username || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, username: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.users.filters.userType')}</label>
              <select
                value={searchParams.user_type || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  user_type: e.target.value as 'user' | 'admin' | undefined
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('common.status.all')}</option>
                <option value="user">{t('admin.users.filters.user')}</option>
                <option value="admin">{t('common.userTypes.admin')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.membershipType')}</label>
              <select
                value={searchParams.membership_type || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  membership_type: e.target.value as 'free' | 'monthly' | 'yearly' | undefined
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ui.all')}</option>
                <option value="free">{t('membership.free')}</option>
                <option value="monthly">{t('membership.monthly')}</option>
                <option value="yearly">{t('membership.yearly')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('table.status')}</label>
              <select
                value={searchParams.is_deleted === undefined ? '' : searchParams.is_deleted.toString()}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  is_deleted: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ui.all')}</option>
                <option value="false">{t('ui.normal')}</option>
                <option value="true">{t('ui.deleted')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.users.sort.sortBy')}</label>
              <select
                value={searchParams.sort_by || 'id'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_by: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="id">{t('admin.users.sort.fields.id')}</option>
                <option value="username">{t('admin.users.sort.fields.username')}</option>
                <option value="email">{t('admin.users.sort.fields.email')}</option>
                <option value="user_type">{t('admin.users.sort.fields.user_type')}</option>
                <option value="membership_type">{t('admin.users.sort.fields.membership_type')}</option>
                <option value="created_at">{t('admin.users.sort.fields.created_at')}</option>
                <option value="last_login_at">{t('admin.users.sort.fields.last_login_at')}</option>
                <option value="chat_count">{t('admin.users.sort.fields.chat_count')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('admin.users.sort.sortOrder')}</label>
              <select
                value={searchParams.sort_order || 'asc'}
                onChange={(e) => setSearchParams({ ...searchParams, sort_order: e.target.value as 'asc' | 'desc' })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="asc">{t('admin.users.sort.directions.asc')}</option>
                <option value="desc">{t('admin.users.sort.directions.desc')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('ui.search')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* 用户列表 */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10 backdrop-blur-sm border-b border-purple-500/20">
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[60px]">{t('table.id')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[120px]">{t('table.username')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[220px]">{t('table.email')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">{t('table.userType')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">{t('table.membership')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">{t('table.status')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[100px]">{t('table.chatCount')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">{t('table.lastLogin')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">{t('table.lastActive')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[140px]">{t('table.registrationTime')}</TableHead>
                <TableHead className="text-purple-700 dark:text-purple-300 font-semibold min-w-[80px]">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="px-6 py-12 text-center">
                    <div className="animate-pulse">{t('ui.loading')}</div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                    {t('user.noUserData')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onUpdate={handleUpdateUser}
                    onDelete={setUserToDelete}
                    onCreate={() => setShowCreateModal(true)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) })}
              disabled={!paginationInfo.has_prev}
            >
              {t('pagination.previousPage')}
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {t('common.pagination.pageInfo', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 10) })}
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
                  end: (searchParams.offset || 0) + users.length,
                  total: paginationInfo.total
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {t('common.pagination.pageInfo', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
              </span>
              <nav className="relative z-0 inline-flex rounded-md space-x-2">
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) })}
                  disabled={!paginationInfo.has_prev}
                >
                  {t('pagination.previousPage')}
                </Button>
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 10) })}
                  disabled={!paginationInfo.has_next}
                >
                  {t('pagination.nextPage')}
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 模态框 */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          fetchUsers(); // Refresh user list
        }}
      />

      <DeleteUserModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onUserUpdated={() => {
          fetchUsers(); // Refresh user list
        }}
      />
    </div>
  );
}
