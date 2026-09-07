/**
 * Professional multi-column footer.
 */
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, MapPin, Phone, Heart } from 'lucide-react';

const footerLinks = {
  'Quick Links': [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Disease Information', path: '/diseases' },
    { label: 'AI Prediction', path: '/predict' },
  ],
  'Services': [
    { label: 'AI Diagnosis', path: '/predict' },
    { label: 'Book Appointment', path: '/dashboard/patient/appointments' },
    { label: 'View Reports', path: '/dashboard/patient/predictions' },
    { label: 'Doctor Review', path: '/dashboard/doctor' },
  ],
  'Legal': [
    { label: 'Privacy Policy', path: '#' },
    { label: 'Terms of Service', path: '#' },
    { label: 'AI Disclaimer', path: '#' },
    { label: 'Contact Us', path: '/#contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">
                Dental <span className="text-primary-400">AI</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              AI-Based Dental Disease Detection and Smart Healthcare Solution
              using Deep Learning. Powered by EfficientNet-B0.
            </p>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-400" /> contact@dentalai.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-400" /> +91 98765 43210
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" /> Mumbai, India
              </p>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="section-container py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} Dental AI. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> using EfficientNet-B0 Deep Learning
          </p>
        </div>
      </div>
    </footer>
  );
}
