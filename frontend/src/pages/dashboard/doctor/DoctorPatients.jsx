/**
 * Doctor Patients List — view assigned patients and their predictions.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Eye, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorAPI } from '../../../api/endpoints';
import { DISEASE_COLORS } from '../../../utils/constants';
import EmptyState from '../../../components/EmptyState';
import { SkeletonCard } from '../../../components/LoadingSkeleton';
import AnimatedPage from '../../../components/AnimatedPage';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    doctorAPI.getPatients()
      .then(({ data }) => setPatients(data.patients || data || []))
      .catch(() => toast.error('Failed to load patients.'))
      .finally(() => setLoading(false));
  }, []);

  const loadPredictions = async (patientId) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
      return;
    }
    setExpandedPatient(patientId);
    if (predictions[patientId]) return;
    try {
      const { data } = await doctorAPI.getPatientPredictions(patientId);
      setPredictions((prev) => ({ ...prev, [patientId]: data.predictions || data || [] }));
    } catch {
      toast.error('Failed to load predictions.');
    }
  };

  const filtered = patients.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Patients</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10 !py-2 w-full sm:w-64 text-sm"
            placeholder="Search patients..."
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No patients found" description="You don't have any assigned patients yet." />
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => {
            const pid = patient.id || patient._id;
            const isExpanded = expandedPatient === pid;
            const patientPreds = predictions[pid] || [];
            return (
              <div key={pid} className="card overflow-hidden">
                <button
                  onClick={() => loadPredictions(pid)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {patient.full_name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{patient.full_name}</h3>
                      <p className="text-sm text-slate-500">{patient.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-400">
                    {isExpanded ? 'Hide' : 'View'} Predictions
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/30 space-y-2">
                    {patientPreds.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No predictions available.</p>
                    ) : (
                      patientPreds.map((pred) => (
                        <div key={pred.id || pred._id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            {pred.image_url ? (
                              <img src={pred.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <FileSearch className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium" style={{ color: DISEASE_COLORS[pred.predicted_class] }}>
                                {pred.predicted_class}
                              </p>
                              <p className="text-xs text-slate-500">{pred.confidence?.toFixed(1)}% • {new Date(pred.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${pred.doctor_review ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {pred.doctor_review ? 'Reviewed' : 'Pending'}
                            </span>
                            <Link
                              to={`/dashboard/doctor/review/${pred.id || pred._id}`}
                              className="btn-ghost text-xs !px-2 !py-1"
                            >
                              <Eye className="w-3 h-3" /> Review
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
