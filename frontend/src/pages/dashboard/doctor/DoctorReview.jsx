/**
 * Doctor Review Page — review AI prediction, add diagnosis notes and prescription.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, CheckCircle, XCircle, Loader2,
  Eye, Layers, Stethoscope, FileText, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { predictionAPI, doctorAPI } from '../../../api/endpoints';
import ConfidenceChart from '../../../components/ConfidenceChart';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { DISEASE_COLORS } from '../../../utils/constants';
import AnimatedPage from '../../../components/AnimatedPage';

export default function DoctorReview() {
  const { predictionId } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradcamView, setGradcamView] = useState('overlay');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    predictionAPI.getById(predictionId)
      .then(({ data }) => setPrediction(data))
      .catch(() => toast.error('Failed to load prediction.'))
      .finally(() => setLoading(false));
  }, [predictionId]);

  const onSubmit = async (data) => {
    try {
      await doctorAPI.reviewPrediction(predictionId, data);
      toast.success('Review submitted successfully!');
      navigate('/dashboard/doctor/patients');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review.');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (!prediction) return <div className="text-center py-16"><p>Prediction not found.</p></div>;

  const { predicted_class, confidence, all_confidences, disease_info,
    image_url, gradcam_base64, gradcam_overlay_base64, gradcam_url, doctor_review } = prediction;
  const color = DISEASE_COLORS[predicted_class] || '#0891B2';

  return (
    <AnimatedPage>
      {/* Breadcrumb */}
      <Link to="/dashboard/doctor/patients" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">AI Prediction Review</p>
            <h1 className="text-2xl font-bold font-display" style={{ color }}>
              {predicted_class}
            </h1>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {confidence?.toFixed(1)}% <span className="text-sm font-normal text-slate-500">confidence</span>
            </p>
          </div>
          {doctor_review && (
            <span className="badge-success text-sm">Already Reviewed</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — Image & Chart */}
        <div className="space-y-6">
          {/* Grad-CAM */}
          <div className="card p-6">
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
                <img src={image_url} alt="Original" className="max-w-full max-h-full object-contain" />
              )}
              {gradcamView === 'heatmap' && gradcam_base64 && (
                <img src={`data:image/png;base64,${gradcam_base64}`} alt="Heatmap" className="max-w-full max-h-full object-contain" />
              )}
              {gradcamView === 'overlay' && (gradcam_overlay_base64 || gradcam_url) && (
                <img src={gradcam_url || `data:image/png;base64,${gradcam_overlay_base64}`} alt="Overlay" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          </div>

          {/* Chart */}
          <ConfidenceChart allConfidences={all_confidences} predictedClass={predicted_class} />
        </div>

        {/* Right — Review Form */}
        <div className="space-y-6">
          {/* Disease Info */}
          {disease_info && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary-500" /> AI Disease Info
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{disease_info.description}</p>
              {disease_info.treatment?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Recommended Treatment:</p>
                  <ul className="space-y-1">
                    {disease_info.treatment.map((t, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Doctor Review Form */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" /> Doctor Review
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Review Status
                </label>
                <select {...register('status', { required: true })} className="input-field">
                  <option value="">Select Status</option>
                  <option value="approved">✅ Approve — AI prediction is correct</option>
                  <option value="rejected">❌ Reject — AI prediction is incorrect</option>
                  <option value="needs_review">⚠️ Needs further investigation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Doctor Diagnosis
                </label>
                <input
                  {...register('diagnosis')}
                  className="input-field"
                  placeholder="Your professional diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Additional clinical notes, observations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Prescription
                </label>
                <textarea
                  {...register('prescription')}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Prescribed medication and treatment plan..."
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><Save className="w-5 h-5" /> Submit Review</>
                )}
              </button>
            </form>
          </div>

          {/* Existing Review */}
          {doctor_review && (
            <div className="card p-6 border-2 border-emerald-200 dark:border-emerald-800">
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Previous Review</h3>
              {doctor_review.diagnosis && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2"><strong>Diagnosis:</strong> {doctor_review.diagnosis}</p>}
              {doctor_review.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2"><strong>Notes:</strong> {doctor_review.notes}</p>}
              {doctor_review.prescription && <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Prescription:</strong> {doctor_review.prescription}</p>}
            </div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
