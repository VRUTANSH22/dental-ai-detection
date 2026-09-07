/**
 * AI Prediction Page — upload dental image, preview, and get prediction.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { predictionAPI } from '../api/endpoints';
import AnimatedPage from '../components/AnimatedPage';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp'];
const MAX_SIZE_MB = 10;

export default function Predict() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback((f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, BMP, or WebP.');
      return;
    }
    if (f.size / (1024 * 1024) > MAX_SIZE_MB) {
      toast.error(`File too large. Maximum ${MAX_SIZE_MB}MB allowed.`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await predictionAPI.predict(formData);
      toast.success(`Prediction complete: ${data.predicted_class}`);
      // Navigate to result page — pass data via state to avoid re-fetch
      navigate(`/predictions/${data.id}`, { state: { prediction: data } });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Prediction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="pt-24 pb-16">
      <div className="section-container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> AI-Powered Analysis
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-slate-900 dark:text-white">
            Dental Disease <span className="gradient-text">Prediction</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-lg mx-auto">
            Upload a clear dental image to get instant AI-powered disease detection
            with Grad-CAM visualization and treatment recommendations.
          </p>
        </div>

        {/* Upload Area */}
        <div className="card p-8">
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                dragOver
                  ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/bmp,image/webp"
                onChange={handleChange}
                className="hidden"
              />
              <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-5">
                <Upload className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Drop your dental image here
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-slate-400">
                Supported: JPG, PNG, BMP, WebP • Max {MAX_SIZE_MB}MB
              </p>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={preview}
                  alt="Dental image preview"
                  className="w-full max-h-[400px] object-contain mx-auto"
                />
                <button
                  onClick={clearFile}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="btn-primary !px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Predict Disease
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-primary-700 dark:text-primary-300 text-sm font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running EfficientNet-B0 inference + Grad-CAM generation...
                  </div>
                  <p className="text-xs text-primary-500 mt-1">This may take a few seconds</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Disclaimer:</strong> This AI tool provides preliminary screening results only
              and does not constitute a medical diagnosis. Always consult a qualified dental
              professional for proper diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
