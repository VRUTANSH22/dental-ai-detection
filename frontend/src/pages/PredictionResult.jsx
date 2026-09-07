/**
 * Prediction Result Page — full prediction display with Grad-CAM, charts, and disease info.
 */
import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Calendar, AlertTriangle, CheckCircle,
  Loader2, Eye, Layers, Info, Stethoscope, Shield, Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { predictionAPI, reportAPI } from '../api/endpoints';
import ConfidenceChart from '../components/ConfidenceChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { DISEASE_COLORS, SEVERITY_COLORS } from '../utils/constants';

export default function PredictionResult() {
  const { id } = useParams();
  const location = useLocation();
  const [prediction, setPrediction] = useState(location.state?.prediction || null);
  const [loading, setLoading] = useState(!prediction);
  const [gradcamView, setGradcamView] = useState('overlay'); // 'original' | 'heatmap' | 'overlay'
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!prediction) {
      predictionAPI.getById(id)
        .then(({ data }) => setPrediction(data))
        .catch(() => toast.error('Failed to load prediction.'))
        .finally(() => setLoading(false));
    }
  }, [id, prediction]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data } = await reportAPI.downloadPdf(id);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DentalAI_Report_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch {
      toast.error('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 flex justify-center"><LoadingSpinner size="lg" /></div>;
  if (!prediction) return <div className="min-h-screen pt-24 text-center"><p>Prediction not found.</p></div>;

  const { predicted_class, confidence, top3, disease_info, all_confidences,
    gradcam_base64, gradcam_overlay_base64, image_url, gradcam_url } = prediction;
  const color = DISEASE_COLORS[predicted_class] || '#0891B2';
  const severityClass = SEVERITY_COLORS[disease_info?.severity] || 'badge-info';

  return (
    <div className="pt-20 pb-16">
      <div className="section-container max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/predict" className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Prediction
          </Link>
        </div>

        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">AI Prediction Result</p>
              <h1 className="text-3xl font-bold font-display" style={{ color }}>
                {predicted_class}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {confidence?.toFixed(1)}%
                </span>
                <span className="text-sm text-slate-500">confidence</span>
                <span className={severityClass}>{disease_info?.severity || 'N/A'}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadPdf} disabled={downloading} className="btn-primary">
                {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {downloading ? 'Generating...' : 'Download PDF'}
              </button>
              <Link to="/dashboard/patient/appointments" className="btn-secondary">
                <Calendar className="w-5 h-5" /> Book Appointment
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column — Images */}
          <div className="space-y-6">
            {/* Grad-CAM Viewer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Image Analysis</h3>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {[
                    { key: 'original', label: 'Original', icon: Eye },
                    { key: 'heatmap', label: 'Heatmap', icon: Layers },
                    { key: 'overlay', label: 'Overlay', icon: Layers },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setGradcamView(key)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                        gradcamView === key
                          ? 'bg-primary-500 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square flex items-center justify-center">
                {gradcamView === 'original' && image_url && (
                  <img src={image_url} alt="Original dental image" className="max-w-full max-h-full object-contain" />
                )}
                {gradcamView === 'original' && !image_url && gradcam_overlay_base64 && (
                  <p className="text-slate-500 text-sm">Original image available in cloud storage</p>
                )}
                {gradcamView === 'heatmap' && gradcam_base64 && (
                  <img src={`data:image/png;base64,${gradcam_base64}`} alt="Grad-CAM heatmap" className="max-w-full max-h-full object-contain" />
                )}
                {gradcamView === 'overlay' && (gradcam_overlay_base64 || gradcam_url) && (
                  <img
                    src={gradcam_url || `data:image/png;base64,${gradcam_overlay_base64}`}
                    alt="Grad-CAM overlay"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Bright areas on the Grad-CAM show regions the AI focused on for its prediction.
              </p>
            </motion.div>

            {/* Top 3 Predictions */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top 3 Predictions</h3>
              <div className="space-y-3">
                {top3?.map((pred, i) => (
                  <div key={pred.class} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{pred.class}</span>
                        <span className="text-sm font-bold" style={{ color: DISEASE_COLORS[pred.class] || '#64748b' }}>
                          {pred.confidence?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pred.confidence}%` }}
                          transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: DISEASE_COLORS[pred.class] || '#94a3b8' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column — Charts & Disease Info */}
          <div className="space-y-6">
            {/* Confidence Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <ConfidenceChart allConfidences={all_confidences} predictedClass={predicted_class} />
            </motion.div>

            {/* Disease Information */}
            {disease_info && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="card p-6 space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-500" /> Disease Information
                </h3>

                {disease_info.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{disease_info.description}</p>
                  </div>
                )}

                {disease_info.symptoms?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Symptoms
                    </h4>
                    <ul className="space-y-1">
                      {disease_info.symptoms.map((s, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {disease_info.causes?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Possible Causes</h4>
                    <ul className="space-y-1">
                      {disease_info.causes.map((c, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {disease_info.treatment?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                      <Stethoscope className="w-4 h-4 text-emerald-500" /> Treatment
                    </h4>
                    <ul className="space-y-1">
                      {disease_info.treatment.map((t, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {disease_info.prevention?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                      <Shield className="w-4 h-4 text-primary-500" /> Prevention Tips
                    </h4>
                    <ul className="space-y-1">
                      {disease_info.prevention.map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <Heart className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>AI Disclaimer:</strong> This prediction is generated by an artificial intelligence system
            for informational purposes only and does not constitute a medical diagnosis. Always consult
            a qualified dental professional for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
