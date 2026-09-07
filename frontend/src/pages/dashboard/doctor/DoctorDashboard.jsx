/**
 * Doctor Dashboard — analytics overview with stats and recent activity.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardCheck, Calendar, TrendingUp } from 'lucide-react';
import { doctorAPI } from '../../../api/endpoints';
import StatCard from '../../../components/StatCard';
import { SkeletonStat } from '../../../components/LoadingSkeleton';
import AnimatedPage from '../../../components/AnimatedPage';

export default function DoctorDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Doctor Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard title="Total Patients" value={analytics?.total_patients || 0} icon="Users" color="primary" delay={0} />
            <StatCard title="Predictions Reviewed" value={analytics?.reviewed_predictions || 0} icon="ClipboardCheck" color="green" delay={0.1} />
            <StatCard title="Pending Reviews" value={analytics?.pending_reviews || 0} icon="Clock" color="amber" delay={0.2} />
            <StatCard title="Appointments" value={analytics?.total_appointments || 0} icon="Calendar" color="purple" delay={0.3} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/dashboard/doctor/patients" className="card p-6 group hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">View Patients</h3>
              <p className="text-sm text-slate-500">Review patient predictions and records</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/doctor/appointments" className="card p-6 group hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Manage Appointments</h3>
              <p className="text-sm text-slate-500">View and manage patient appointments</p>
            </div>
          </div>
        </Link>
      </div>
    </AnimatedPage>
  );
}
