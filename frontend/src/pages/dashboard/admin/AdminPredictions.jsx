/**
 * Admin Predictions — view all predictions system-wide.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/endpoints';
import { DISEASE_COLORS } from '../../../utils/constants';
import EmptyState from '../../../components/EmptyState';
import AnimatedPage from '../../../components/AnimatedPage';

export default function AdminPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getPredictions()
      .then(({ data }) => setPredictions(data.predictions || data || []))
      .catch(() => toast.error('Failed to load predictions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = predictions.filter((p) =>
    p.predicted_class?.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Predictions</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10 !py-2 w-full sm:w-64 text-sm"
            placeholder="Search by disease or patient..."
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileSearch} title="No predictions found" description="No predictions match your search." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Disease</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Confidence</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Review</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((pred) => {
                  const pid = pred.id || pred._id;
                  return (
                    <tr key={pid} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {pred.patient_name || 'Unknown'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold" style={{ color: DISEASE_COLORS[pred.predicted_class] }}>
                          {pred.predicted_class}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {pred.confidence?.toFixed(1)}%
                      </td>
                      <td className="px-5 py-4">
                        <span className={pred.doctor_review ? 'badge-success' : 'badge-warning'}>
                          {pred.doctor_review ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link to={`/predictions/${pid}`} className="btn-ghost text-xs">
                          <Eye className="w-3 h-3" /> View
                        </Link>
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
