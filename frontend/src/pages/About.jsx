/**
 * About Page — project information, tech stack, and team.
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, Code, Database, Shield, Cpu, Globe, ArrowRight,
  Layers, Zap, CheckCircle,
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';

const techStack = [
  { category: 'AI / Deep Learning', items: [
    { name: 'EfficientNet-B0', desc: 'Transfer-learning backbone pretrained on ImageNet' },
    { name: 'PyTorch', desc: 'Deep learning framework for model inference' },
    { name: 'Grad-CAM', desc: 'Explainability heatmaps via gradient-weighted class activation' },
    { name: 'OpenCV / Pillow', desc: 'Image preprocessing and augmentation' },
  ]},
  { category: 'Backend', items: [
    { name: 'FastAPI', desc: 'High-performance async Python web framework' },
    { name: 'MongoDB', desc: 'NoSQL document database for flexible healthcare data' },
    { name: 'JWT + bcrypt', desc: 'Secure authentication and password hashing' },
    { name: 'Cloudinary', desc: 'Cloud image storage and management' },
  ]},
  { category: 'Frontend', items: [
    { name: 'React 19', desc: 'Component-based UI framework' },
    { name: 'Tailwind CSS', desc: 'Utility-first CSS framework with custom dental theme' },
    { name: 'Framer Motion', desc: 'Declarative animations and page transitions' },
    { name: 'Recharts', desc: 'Data visualization for confidence distributions' },
  ]},
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function About() {
  return (
    <AnimatedPage className="pt-24 pb-16">
      {/* Hero */}
      <section className="section-container mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" /> About the Project
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 dark:text-white mb-6">
              AI-Based Dental Disease Detection &{' '}
              <span className="gradient-text">Smart Healthcare</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              A comprehensive deep learning solution for detecting 6 common oral diseases
              from dental images, powered by EfficientNet-B0 with Grad-CAM explainability.
              Built as a Major Project for B.E. Computer Engineering.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
        <div className="section-container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Oral diseases affect billions worldwide, yet early detection remains a challenge,
                especially in underserved areas. Our mission is to leverage artificial intelligence
                to democratize access to preliminary dental screening.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                By combining state-of-the-art deep learning with an intuitive web interface,
                we enable patients to get instant AI-powered insights about their oral health,
                bridge the gap between initial screening and professional care, and empower
                dentists with AI-assisted diagnostic tools.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Brain, label: '6 Diseases', desc: 'Detected by AI' },
                { icon: Zap, label: '< 3 Seconds', desc: 'Inference time' },
                { icon: Layers, label: 'Grad-CAM', desc: 'Explainable AI' },
                { icon: Shield, label: 'HIPAA-aware', desc: 'Data security' },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i} className="card p-5 text-center">
                  <item.icon className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16">
        <div className="section-container">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="section-title mb-12">
              Technology <span className="gradient-text">Stack</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {techStack.map((group, gi) => (
              <motion.div
                key={group.category}
                variants={fadeUp}
                custom={gi}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  {gi === 0 && <Cpu className="w-5 h-5 text-primary-500" />}
                  {gi === 1 && <Database className="w-5 h-5 text-emerald-500" />}
                  {gi === 2 && <Globe className="w-5 h-5 text-purple-500" />}
                  {group.category}
                </h3>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="section-container">
          <div className="card p-10 text-center bg-gradient-to-r from-primary-600 to-cyan-500 border-none">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Ready to Try AI Dental Detection?
            </h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Upload a dental image and get instant predictions with confidence scores and Grad-CAM heatmaps.
            </p>
            <Link to="/predict" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
              <ArrowRight className="w-5 h-5" /> Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
