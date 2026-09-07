/**
 * Home Page — Premium healthcare landing page with all sections.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as Icons from 'lucide-react';
import {
  FEATURES_DATA, HOW_IT_WORKS, STATS_DATA, FAQ_DATA, DISEASE_CLASSES, DISEASE_COLORS,
} from '../utils/constants';
import { contactAPI } from '../api/endpoints';
import AnimatedPage from '../components/AnimatedPage';

/* ─── Animation Helpers ──────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ═══════════════════════ HOME PAGE ═══════════════════════ */
export default function Home() {
  return (
    <AnimatedPage>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DiseasesSection />
      <StatsSection />
      <FAQSection />
      <ContactSection />
    </AnimatedPage>
  );
}

/* ─── Hero Section ───────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary-300/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-300/15 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
              <Icons.Sparkles className="w-4 h-4" />
              AI-Powered Healthcare
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance">
              <span className="text-slate-900 dark:text-white">Smart Dental </span>
              <span className="gradient-text">Disease Detection</span>
              <span className="text-slate-900 dark:text-white"> with AI</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              Upload a dental image and get instant AI-powered diagnosis with confidence
              scores, Grad-CAM visualizations, and professional treatment recommendations.
              Powered by EfficientNet-B0 deep learning.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/predict" className="btn-primary text-base !px-8 !py-4">
                <Icons.Upload className="w-5 h-5" />
                Get AI Diagnosis
              </Link>
              <Link to="/about" className="btn-secondary text-base !px-8 !py-4">
                <Icons.Info className="w-5 h-5" />
                Learn More
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Icons.ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure & Private
              </span>
              <span className="flex items-center gap-1.5">
                <Icons.Zap className="w-4 h-4 text-amber-500" /> Instant Results
              </span>
              <span className="flex items-center gap-1.5">
                <Icons.Award className="w-4 h-4 text-primary-500" /> 95%+ Accuracy
              </span>
            </div>
          </motion.div>

          {/* Right — Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-2xl shadow-primary-500/30 flex items-center justify-center animate-float">
                <Icons.Stethoscope className="w-40 h-40 text-white/90" />
              </div>
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 glass-card px-4 py-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icons.Check className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">AI Analysis</p>
                  <p className="text-[10px] text-slate-500">Complete</p>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 glass-card px-4 py-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Icons.Brain className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">6 Diseases</p>
                  <p className="text-[10px] text-slate-500">Detected</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ───────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-slate-950">
      <div className="section-container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="section-subtitle">
            Everything you need for AI-powered dental disease detection, from
            prediction to professional review.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
        >
          {FEATURES_DATA.map((feature, i) => {
            const Icon = Icons[feature.icon] || Icons.Star;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="card p-8 group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-5 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                  <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ───────────────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50">
      <div className="section-container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="section-subtitle">
            Four simple steps to get an AI-powered dental disease diagnosis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = Icons[step.icon] || Icons.Star;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/25">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-primary-500 flex items-center justify-center text-xs font-bold text-primary-600 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-top-3">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
                {/* Connector line (hidden on last item) */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary-300 to-primary-100 dark:from-primary-700 dark:to-primary-900" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Disease Categories ─────────────────────────────────────────────────── */
function DiseasesSection() {
  const diseaseIcons = {
    Calculus: Icons.CircleDot,
    Caries: Icons.AlertTriangle,
    Gingivitis: Icons.Heart,
    'Tooth Discoloration': Icons.Palette,
    Ulcers: Icons.Shield,
    Hypodontia: Icons.Info,
  };

  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-slate-950">
      <div className="section-container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title">
            Detectable <span className="gradient-text">Diseases</span>
          </h2>
          <p className="section-subtitle">
            Our AI model is trained to detect 6 common oral diseases from dental images.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16">
          {DISEASE_CLASSES.map((disease, i) => {
            const Icon = diseaseIcons[disease] || Icons.Activity;
            const color = DISEASE_COLORS[disease];
            return (
              <motion.div
                key={disease}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="card p-6 text-center group hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {disease}
                </h3>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link to="/diseases" className="btn-secondary">
            <Icons.ArrowRight className="w-4 h-4" /> View Detailed Information
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Statistics ─────────────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section className="py-20 lg:py-24 bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-50" />
      <div className="section-container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS_DATA.map((stat, i) => {
            const Icon = Icons[stat.icon] || Icons.Activity;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center text-white"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <p className="text-3xl lg:text-4xl font-bold font-display mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-white/80">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section ────────────────────────────────────────────────────────── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-900/50">
      <div className="section-container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="section-subtitle">
            Find answers to common questions about our AI dental detection system.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto mt-16 space-y-3">
          {FAQ_DATA.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-slate-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <Icons.ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === i ? 'auto' : 0,
                  opacity: openIndex === i ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact Section ────────────────────────────────────────────────────── */
function ContactSection() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await contactAPI.submit(data);
      toast.success('Message sent successfully! We will get back to you soon.');
      reset();
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white dark:bg-slate-950">
      <div className="section-container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <h2 className="section-title">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="section-subtitle">
            Have questions? Send us a message and we&apos;ll get back to you shortly.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mt-16"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="input-field"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                  className="input-field"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Subject
              </label>
              <input
                {...register('subject', { required: 'Subject is required' })}
                className="input-field"
                placeholder="How can we help?"
              />
              {errors.subject && (
                <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Message
              </label>
              <textarea
                {...register('message', { required: 'Message is required' })}
                className="input-field min-h-[140px] resize-none"
                placeholder="Tell us more about your inquiry..."
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader2 className="w-5 h-5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Icons.Send className="w-5 h-5" /> Send Message
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
