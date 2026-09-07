/**
 * Diseases Information Page — detailed info for all 6 detectable diseases.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Shield, Heart, Stethoscope,
  ChevronDown, ArrowRight,
} from 'lucide-react';
import { reportAPI } from '../api/endpoints';
import { DISEASE_COLORS } from '../utils/constants';
import AnimatedPage from '../components/AnimatedPage';
import LoadingSpinner from '../components/LoadingSpinner';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function Diseases() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    reportAPI.getDiseaseInfo()
      .then(({ data }) => {
        // data may be an object keyed by disease name or an array
        if (Array.isArray(data)) {
          setDiseases(data);
        } else {
          setDiseases(Object.entries(data).map(([name, info]) => ({ name, ...info })));
        }
      })
      .catch(() => {
        // Fallback to hardcoded disease names
        setDiseases([
          { name: 'Calculus', description: 'Calculus (tartar) is hardened dental plaque formed from mineralized bacteria.', severity: 'Mild to Moderate', symptoms: ['Yellow/brown deposits on teeth', 'Bad breath', 'Gum irritation'], causes: ['Poor oral hygiene', 'Irregular brushing'], treatment: ['Professional dental cleaning', 'Scaling and root planing'], prevention: ['Regular brushing twice daily', 'Flossing', 'Regular dental checkups'] },
          { name: 'Caries', description: 'Dental caries (tooth decay) are damaged areas in teeth that develop into tiny holes or cavities.', severity: 'Moderate to High', symptoms: ['Toothache', 'Sensitivity', 'Visible holes in teeth', 'Dark staining'], causes: ['Bacteria', 'Sugary foods', 'Poor oral hygiene'], treatment: ['Dental fillings', 'Crowns', 'Root canal'], prevention: ['Fluoride toothpaste', 'Limit sugar intake', 'Regular checkups'] },
          { name: 'Gingivitis', description: 'Gingivitis is a mild form of gum disease that causes irritation, redness, and swelling of the gingiva.', severity: 'Mild', symptoms: ['Red swollen gums', 'Bleeding while brushing', 'Bad breath'], causes: ['Plaque buildup', 'Hormonal changes', 'Smoking'], treatment: ['Professional cleaning', 'Improved oral hygiene'], prevention: ['Regular brushing and flossing', 'Antiseptic mouthwash'] },
          { name: 'Tooth Discoloration', description: 'Tooth discoloration refers to staining or color changes in teeth due to extrinsic or intrinsic factors.', severity: 'Mild', symptoms: ['Yellow, brown, or grey stains', 'Uneven tooth color'], causes: ['Coffee, tea, wine', 'Tobacco', 'Medications', 'Aging'], treatment: ['Professional whitening', 'Dental veneers', 'Bonding'], prevention: ['Limit staining foods', 'Regular cleaning', 'No tobacco'] },
          { name: 'Ulcers', description: 'Oral ulcers (canker sores) are painful lesions that appear in the mouth on the soft tissues.', severity: 'Variable', symptoms: ['Painful round sores', 'Difficulty eating', 'Burning sensation'], causes: ['Stress', 'Minor injuries', 'Nutritional deficiency', 'Hormonal changes'], treatment: ['Topical pain relief', 'Antimicrobial mouthwash', 'Corticosteroids'], prevention: ['Stress management', 'Balanced diet', 'Gentle oral hygiene'] },
          { name: 'Hypodontia', description: 'Hypodontia is the developmental absence of one or more teeth (excluding wisdom teeth).', severity: 'Moderate', symptoms: ['Gaps in teeth', 'Misalignment', 'Spacing issues'], causes: ['Genetic factors', 'Developmental anomalies'], treatment: ['Dental implants', 'Bridges', 'Orthodontic treatment'], prevention: ['Not preventable (genetic)', 'Early dental monitoring'] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AnimatedPage className="pt-24 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4">
              <Stethoscope className="w-4 h-4" /> 6 Detectable Conditions
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 dark:text-white mb-4">
              Dental <span className="gradient-text">Disease Information</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Learn about the oral diseases our AI model can detect, their symptoms,
              causes, treatments, and prevention strategies.
            </p>
          </motion.div>
        </div>

        {/* Disease Cards */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {diseases.map((disease, i) => {
            const color = DISEASE_COLORS[disease.name] || '#0891B2';
            const isExpanded = expandedIndex === i;
            return (
              <motion.div
                key={disease.name}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Stethoscope className="w-7 h-7" style={{ color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color }}>
                        {disease.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {disease.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {disease.severity && (
                      <span className="badge-info text-xs hidden sm:inline-flex">{disease.severity}</span>
                    )}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-slate-200 dark:border-slate-700 p-6 space-y-5"
                  >
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {disease.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-5">
                      {/* Symptoms */}
                      {disease.symptoms?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-amber-500" /> Symptoms
                          </h4>
                          <ul className="space-y-1.5">
                            {disease.symptoms.map((s, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Causes */}
                      {disease.causes?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Causes</h4>
                          <ul className="space-y-1.5">
                            {disease.causes.map((c, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Treatment */}
                      {disease.treatment?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-emerald-500" /> Treatment
                          </h4>
                          <ul className="space-y-1.5">
                            {disease.treatment.map((t, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Prevention */}
                      {disease.prevention?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                            <Shield className="w-4 h-4 text-primary-500" /> Prevention
                          </h4>
                          <ul className="space-y-1.5">
                            {disease.prevention.map((p, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <Heart className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/predict" className="btn-primary text-base !px-8 !py-4">
            <ArrowRight className="w-5 h-5" /> Try AI Detection Now
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
