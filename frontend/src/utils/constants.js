/* ─── API Base URLs & Config ────────────────────────────────────────────── */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ─── Disease Classes ───────────────────────────────────────────────────── */

export const DISEASE_CLASSES = [
  'Calculus',
  'Caries',
  'Gingivitis',
  'Tooth Discoloration',
  'Ulcers',
  'Hypodontia',
];

/* ─── Disease Colors (matching disease_info.json) ──────────────────────── */

export const DISEASE_COLORS = {
  Calculus: '#F59E0B',
  Caries: '#EF4444',
  Gingivitis: '#10B981',
  'Tooth Discoloration': '#8B5CF6',
  Ulcers: '#F97316',
  Hypodontia: '#06B6D4',
};

/* ─── Severity Colors ──────────────────────────────────────────────────── */

export const SEVERITY_COLORS = {
  Mild: 'badge-success',
  'Mild to Moderate': 'badge-warning',
  Moderate: 'badge-warning',
  High: 'badge-danger',
  Variable: 'badge-info',
};

/* ─── Navigation Links ─────────────────────────────────────────────────── */

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Diseases', path: '/diseases' },
  { label: 'AI Prediction', path: '/predict', auth: true },
  { label: 'Contact', path: '/#contact' },
];

/* ─── Appointment Status Options ───────────────────────────────────────── */

export const APPOINTMENT_STATUS = {
  pending: { label: 'Pending', class: 'badge-warning' },
  confirmed: { label: 'Confirmed', class: 'badge-success' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  rescheduled: { label: 'Rescheduled', class: 'badge-info' },
  completed: { label: 'Completed', class: 'badge-success' },
  cancelled: { label: 'Cancelled', class: 'badge-danger' },
};

/* ─── Review Status Options ────────────────────────────────────────────── */

export const REVIEW_STATUS = {
  approved: { label: 'Approved', class: 'badge-success' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  needs_review: { label: 'Needs Review', class: 'badge-warning' },
};

/* ─── User Roles ───────────────────────────────────────────────────────── */

export const USER_ROLES = {
  patient: { label: 'Patient', dashboardPath: '/dashboard/patient' },
  doctor: { label: 'Doctor', dashboardPath: '/dashboard/doctor' },
  admin: { label: 'Admin', dashboardPath: '/dashboard/admin' },
};

/* ─── FAQ Data ─────────────────────────────────────────────────────────── */

export const FAQ_DATA = [
  {
    question: 'How does the AI detect dental diseases?',
    answer: 'Our system uses EfficientNet-B0, a state-of-the-art deep learning model trained on thousands of dental images. When you upload an image, the model analyzes it and predicts the most likely dental condition with a confidence score.',
  },
  {
    question: 'Is the AI prediction a substitute for a dental visit?',
    answer: 'No. Our AI provides preliminary screening results only. Every prediction includes a disclaimer that results should be verified by a qualified dental professional. Think of it as a smart first-step to help you understand potential issues.',
  },
  {
    question: 'What types of dental images should I upload?',
    answer: 'Upload clear, well-lit photographs of your teeth and gums. Intraoral photos work best. Supported formats include JPG, PNG, BMP, and WebP (max 10MB).',
  },
  {
    question: 'What is Grad-CAM and why is it shown?',
    answer: 'Grad-CAM (Gradient-weighted Class Activation Mapping) is an explainability technique that highlights the areas of your image that the AI focused on when making its prediction. This helps you and your dentist understand the reasoning behind the diagnosis.',
  },
  {
    question: 'Can a doctor review my AI prediction?',
    answer: 'Yes! After receiving your AI prediction, you can book an appointment with a registered dentist on our platform. The doctor can then review the AI results, add their professional diagnosis, notes, and prescription.',
  },
  {
    question: 'How is my data protected?',
    answer: 'We use JWT authentication, bcrypt password hashing, secure Cloudinary storage for images, and HTTPS encryption. Your medical images and data are private and only accessible to you, your assigned doctor, and authorized administrators.',
  },
  {
    question: 'Can I download a report of my prediction?',
    answer: 'Yes. After each prediction, you can download a professional hospital-style PDF report containing your results, Grad-CAM visualization, disease information, and doctor review if available.',
  },
  {
    question: 'What diseases can the system detect?',
    answer: 'The system currently detects 6 oral conditions: Calculus (tartar), Caries (tooth decay), Gingivitis, Tooth Discoloration, Ulcers, and Hypodontia (missing teeth).',
  },
];

/* ─── Features Data ────────────────────────────────────────────────────── */

export const FEATURES_DATA = [
  {
    icon: 'Brain',
    title: 'AI-Powered Diagnosis',
    description: 'EfficientNet-B0 deep learning model trained on dental radiographs to detect 6 oral diseases with high accuracy.',
  },
  {
    icon: 'Eye',
    title: 'Grad-CAM Visualization',
    description: 'See exactly what the AI focuses on with attention heatmaps overlaid on your dental images.',
  },
  {
    icon: 'FileText',
    title: 'PDF Reports',
    description: 'Download professional hospital-style reports with patient info, predictions, and doctor reviews.',
  },
  {
    icon: 'Shield',
    title: 'Secure & Private',
    description: 'JWT authentication, bcrypt encryption, and secure cloud storage protect your medical data.',
  },
  {
    icon: 'CalendarCheck',
    title: 'Smart Appointments',
    description: 'Book, manage, and track appointments with registered dental professionals seamlessly.',
  },
  {
    icon: 'Stethoscope',
    title: 'Doctor Review',
    description: 'Dentists can review AI predictions, add notes, prescriptions, and approve or flag results.',
  },
];

/* ─── How It Works Steps ───────────────────────────────────────────────── */

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Upload Image',
    description: 'Take a clear photo of your teeth or oral area and upload it to our secure platform.',
    icon: 'Upload',
  },
  {
    step: 2,
    title: 'AI Analysis',
    description: 'Our EfficientNet-B0 model processes your image through advanced deep learning inference.',
    icon: 'Cpu',
  },
  {
    step: 3,
    title: 'Get Results',
    description: 'Receive detailed predictions with confidence scores, Grad-CAM heatmaps, and disease information.',
    icon: 'BarChart3',
  },
  {
    step: 4,
    title: 'Doctor Review',
    description: 'Book an appointment for a professional review and receive a complete diagnostic report.',
    icon: 'UserCheck',
  },
];

/* ─── Stats Data ───────────────────────────────────────────────────────── */

export const STATS_DATA = [
  { value: '6', label: 'Diseases Detected', icon: 'Activity' },
  { value: '95%+', label: 'Model Accuracy', icon: 'Target' },
  { value: '< 3s', label: 'Prediction Time', icon: 'Zap' },
  { value: '24/7', label: 'Available', icon: 'Clock' },
];
