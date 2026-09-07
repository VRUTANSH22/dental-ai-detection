/**
 * Admin Dashboard — system-wide analytics and overview.
 */
import { useState, useEffect } from 'react';
import { Users, FileSearch, Calendar, MessageSquare } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { adminAPI } from '../../../api/endpoints';
import StatCard from '../../../components/StatCard';
import { SkeletonStat } from '../../../components/LoadingSkeleton';
import { DISEASE_COLORS } from '../../../utils/constants';
import AnimatedPage from '../../../components/AnimatedPage';

const COLORS = ['#0891B2', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pieData = analytics?.disease_distribution
    ? Object.entries(analytics.disease_distribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard title="Total Users" value={analytics?.total_users || 0} icon="Users" color="primary" delay={0} />
            <StatCard title="Total Predictions" value={analytics?.total_predictions || 0} icon="FileSearch" color="green" delay={0.1} />
            <StatCard title="Appointments" value={analytics?.total_appointments || 0} icon="Calendar" color="amber" delay={0.2} />
            <StatCard title="Contact Messages" value={analytics?.total_messages || 0} icon="MessageSquare" color="purple" delay={0.3} />
          </>
        )}
      </div>

      {/* Charts */}
      {!loading && analytics && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Disease Distribution Pie */}
          {pieData.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Disease Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={DISEASE_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Predictions']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* User Roles Breakdown */}
          {analytics?.user_roles && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Roles</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics.user_roles).map(([name, value]) => ({ name, count: value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                  <YAxis fontSize={12} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0891B2" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}
