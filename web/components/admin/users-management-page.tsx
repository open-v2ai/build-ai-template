'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Shield, UserX, User as UserIcon, Edit2, UserPlus, Trash2, RotateCcw, Crown, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetcher } from '@/util/fetcher';
import { formatDateTime, formatDate } from '@/util/dateFormat';
import CreateUserModal from '@/components/admin/create-user-modal';
import DeleteUserModal from '@/components/admin/delete-user-modal';
import type { User, UserSearchParams, UserUpdateRequest, UserListResponse } from '@/app/[locale]/admin/types';

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
    membership_type: user.membership_type,
    is_deleted: user.is_deleted,
  });

  const handleSave = () => {
    onUpdate(user.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      username: user.username || '',
      user_type: user.user_type,
      membership_type: user.membership_type,
      is_deleted: user.is_deleted,
    });
    setIsEditing(false);
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return <Crown className="w-3 h-3 mr-1" />;
      case 'admin':
        return <Shield className="w-3 h-3 mr-1" />;
      case 'premium':
        return <Star className="w-3 h-3 mr-1" />;
      default:
        return <UserIcon className="w-3 h-3 mr-1" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMembershipTypeColor = (membershipType: string) => {
    switch (membershipType) {
      case 'lifetime':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'yearly':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'monthly':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <tr className={`border-b border-border hover:bg-muted/50 h-16 ${user.is_deleted ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4 text-sm text-foreground leading-tight max-h-16 overflow-hidden">{user.id}</td>
      <td className="px-6 py-4 text-sm text-foreground leading-tight max-h-16 overflow-hidden">
        {isEditing ? (
          <Input
            value={editData.username || ''}
            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            className="w-full"
            placeholder={t('USERNAME_PLACEHOLDER')}
          />
        ) : (
          <div className="truncate max-w-32" title={user.username || t('NOT_SET')}>
            {user.username || t('NOT_SET')}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-foreground leading-tight max-h-16 overflow-hidden">
        <div className="truncate max-w-48" title={user.email}>
          {user.email}
        </div>
      </td>
      <td className="px-6 py-4 text-sm leading-tight max-h-16 overflow-hidden">
        {isEditing ? (
          <select
            value={editData.user_type}
            onChange={(e) => setEditData({ ...editData, user_type: e.target.value as 'normal' | 'premium' | 'admin' | 'super_admin' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="normal">{t('NORMAL_USER')}</option>
            <option value="premium">{t('PREMIUM_USER')}</option>
            <option value="admin">{t('ADMIN_USER')}</option>
            <option value="super_admin">{t('SUPER_ADMIN_USER')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
            {getUserTypeIcon(user.user_type)}
            <span className="truncate">{t(user.user_type.toUpperCase() + '_USER')}</span>
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm leading-tight max-h-16 overflow-hidden">
        {isEditing ? (
          <select
            value={editData.membership_type}
            onChange={(e) => setEditData({ ...editData, membership_type: e.target.value as 'free' | 'monthly' | 'yearly' | 'lifetime' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="free">{t('FREE_MEMBERSHIP')}</option>
            <option value="monthly">{t('MONTHLY_MEMBERSHIP')}</option>
            <option value="yearly">{t('YEARLY_MEMBERSHIP')}</option>
            <option value="lifetime">{t('LIFETIME_MEMBERSHIP')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMembershipTypeColor(user.membership_type)}`}>
            <span className="truncate">{t(user.membership_type.toUpperCase() + '_MEMBERSHIP')}</span>
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm leading-tight max-h-16 overflow-hidden">
        {isEditing ? (
          <select
            value={editData.is_deleted ? 'true' : 'false'}
            onChange={(e) => setEditData({ ...editData, is_deleted: e.target.value === 'true' })}
            className="border border-border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="false">{t('NORMAL')}</option>
            <option value="true">{t('DELETED')}</option>
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_deleted
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
            {user.is_deleted ? (
              <><UserX className="w-3 h-3 mr-1" /> <span className="truncate">{t('DELETED')}</span></>
            ) : (
              <span className="truncate">{t('NORMAL')}</span>
            )}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground leading-tight max-h-16 overflow-hidden w-32 text-center">{user.chat_count}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground leading-tight max-h-16 overflow-hidden whitespace-nowrap">
        {user.last_login_at ? formatDateTime(user.last_login_at) : t('NEVER_LOGGED_IN')}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground leading-tight max-h-16 overflow-hidden whitespace-nowrap">
        {user.last_active ? formatDate(user.last_active) : t('NEVER_ACTIVE')}
      </td>
      <td className="px-6 py-4 text-sm text-muted-foreground leading-tight max-h-16 overflow-hidden whitespace-nowrap">
        {formatDateTime(user.created_at)}
      </td>
      <td className="px-6 py-4 text-sm leading-tight max-h-16 overflow-hidden">
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>{t('SAVE')}</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>{t('CANCEL')}</Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                title={t('EDIT_USER')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(user)}
                title={user.is_deleted ? t('RESTORE_USER') : t('DELETE_USER')}
                className={user.is_deleted ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
              >
                {user.is_deleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCreate}
                title={t('CREATE_USER')}
                className="text-blue-600 hover:text-blue-700"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        auth: true,
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('USER_SEARCH')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('SEARCH_EMAIL_PLACEHOLDER')}
                  value={searchParams.email || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('USER_TYPE')}</label>
              <select
                value={searchParams.user_type || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  user_type: e.target.value as 'normal' | 'premium' | 'admin' | 'super_admin' | undefined
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ALL')}</option>
                <option value="normal">{t('NORMAL_USER')}</option>
                <option value="premium">{t('PREMIUM_USER')}</option>
                <option value="admin">{t('ADMIN_USER')}</option>
                <option value="super_admin">{t('SUPER_ADMIN_USER')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('MEMBERSHIP_TYPE')}</label>
              <select
                value={searchParams.membership_type || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  membership_type: e.target.value as 'free' | 'monthly' | 'yearly' | 'lifetime' | undefined
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ALL')}</option>
                <option value="free">{t('FREE_MEMBERSHIP')}</option>
                <option value="monthly">{t('MONTHLY_MEMBERSHIP')}</option>
                <option value="yearly">{t('YEARLY_MEMBERSHIP')}</option>
                <option value="lifetime">{t('LIFETIME_MEMBERSHIP')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('STATUS')}</label>
              <select
                value={searchParams.is_deleted === undefined ? '' : searchParams.is_deleted.toString()}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  is_deleted: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">{t('ALL')}</option>
                <option value="false">{t('NORMAL')}</option>
                <option value="true">{t('DELETED')}</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">{t('SEARCH')}</Button>
            </div>
          </div>
        </form>
      </div>

      {/* 用户列表 */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ID')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('USERNAME')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('EMAIL')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('USER_TYPE')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('MEMBERSHIP')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('STATUS')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">{t('CHAT_COUNT')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">{t('LAST_LOGIN')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">{t('LAST_ACTIVE')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">{t('REGISTRATION_TIME')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('ACTIONS')}</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="animate-pulse">{t('LOADING')}</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                    {t('NO_USER_DATA')}
                  </td>
                </tr>
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
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) })}
              disabled={!paginationInfo.has_prev}
            >
              {t('PREVIOUS_PAGE')}
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {t('PAGE_INFO', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 10) })}
              disabled={!paginationInfo.has_next}
            >
              {t('NEXT_PAGE')}
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('SHOW_RECORDS_WITH_TOTAL', {
                  start: (searchParams.offset || 0) + 1,
                  end: (searchParams.offset || 0) + users.length,
                  total: paginationInfo.total
                })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {t('PAGE_INFO', { current: paginationInfo.current_page, total: paginationInfo.total_pages })}
              </span>
              <nav className="relative z-0 inline-flex rounded-md space-x-2">
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: Math.max(0, (searchParams.offset || 0) - (searchParams.limit || 10)) })}
                  disabled={!paginationInfo.has_prev}
                >
                  {t('PREVIOUS_PAGE')}
                </Button>
                <Button
                  className="shadow-sm"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchParams({ ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 10) })}
                  disabled={!paginationInfo.has_next}
                >
                  {t('NEXT_PAGE')}
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
