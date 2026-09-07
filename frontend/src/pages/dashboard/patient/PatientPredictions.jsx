import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Download, Loader2, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientAPI, reportAPI } from '../../../api/endpoints';
import { DISEASE_COLORS, SEVERITY_COLORS } from '../../../utils/constants';
import EmptyState from '../../../components/EmptyState';
import { SkeletonCard } from '../../../components/LoadingSkeleton';
import AnimatedPage from '../../../components/AnimatedPage';

export default function PatientPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientAPI.getPredictions()
      .then(({ data }) => setPredictions(data.predictions || data || []))
      .catch(() => toast.error('Failed to load predictions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = predictions.filter((p) =>
    p.predicted_class?.toLowerCase().includes(search.toLowerCase())
  );

  const downloadReport = async (id) => {
    try {
      const { data } = await reportAPI.downloadPdf(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DentalAI_Report_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download report.');
    }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Predictions</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10 !py-2 w-full sm:w-64 text-sm"
            placeholder="Search by disease..."
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No predictions yet"
          description="Upload a dental image to get your first AI prediction."
          action={<Link to="/predict" className="btn-primary">Get Started</Link>}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((pred) => (
            <div key={pred.id || pred._id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {pred.image_url ? (
                  <img src={pred.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileSearch className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white" style={{ color: DISEASE_COLORS[pred.predicted_class] }}>
                    {pred.predicted_class}
                  </h3>
                  <p className="text-sm text-slate-500">{pred.confidence?.toFixed(1)}% confidence</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(pred.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/predictions/${pred.id || pred._id}`} className="btn-ghost text-sm">
                  <Eye className="w-4 h-4" /> View
                </Link>
                <button onClick={() => downloadReport(pred.id || pred._id)} className="btn-ghost text-sm">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
