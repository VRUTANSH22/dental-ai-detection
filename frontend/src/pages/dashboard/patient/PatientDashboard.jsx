import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, Calendar, Clock, Activity } from 'lucide-react';
import { patientAPI } from '../../../api/endpoints';
import StatCard from '../../../components/StatCard';
import { SkeletonStat } from '../../../components/LoadingSkeleton';
import AnimatedPage from '../../../components/AnimatedPage';

export default function PatientDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Patient Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard title="Total Predictions" value={stats?.total_predictions || 0} icon="FileSearch" color="primary" delay={0} />
            <StatCard title="Appointments" value={stats?.total_appointments || 0} icon="Calendar" color="green" delay={0.1} />
            <StatCard title="Pending Reviews" value={stats?.pending_reviews || 0} icon="Clock" color="amber" delay={0.2} />
            <StatCard title="Last Disease" value={stats?.last_prediction?.predicted_class || 'None'} icon="Activity" color="purple" delay={0.3} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/predict" className="card p-6 group hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSearch className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">New AI Prediction</h3>
              <p className="text-sm text-slate-500">Upload a dental image for analysis</p>
            </div>
          </div>
        </Link>
        <Link to="/dashboard/patient/appointments" className="card p-6 group hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Book Appointment</h3>
              <p className="text-sm text-slate-500">Schedule a dental consultation</p>
            </div>
          </div>
        </Link>
      </div>
    </AnimatedPage>
  );
}
