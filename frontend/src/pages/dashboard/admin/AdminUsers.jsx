/**
 * Admin Users Management — view, search, and manage all users.
 */
import { useState, useEffect } from 'react';
import { Search, Users, Trash2, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/endpoints';
import EmptyState from '../../../components/EmptyState';
import AnimatedPage from '../../../components/AnimatedPage';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    adminAPI.getUsers()
      .then(({ data }) => setUsers(data.users || data || []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false));
  };

  const updateRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      toast.success(`Role updated to ${newRole}.`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted.');
      loadUsers();
    } catch {
      toast.error('Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role) => {
    const map = {
      patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      doctor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[role] || map.patient}`;
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Users</h1>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field !py-2 !w-auto text-sm"
          >
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-10 !py-2 w-full sm:w-56 text-sm"
              placeholder="Search users..."
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search criteria." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((user) => {
                  const uid = user.id || user._id;
                  return (
                    <tr key={uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-sm text-slate-900 dark:text-white">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className={roleBadge(user.role)}>{user.role}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={user.is_verified ? 'badge-success' : 'badge-warning'}>
                          {user.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => updateRole(uid, e.target.value)}
                            disabled={actionLoading === uid}
                            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteUser(uid, user.full_name)}
                            disabled={actionLoading === uid}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            {actionLoading === uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
