import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardLayout from './components/DashboardLayout';

// ─── Lazy-loaded Pages ──────────────────────────────────────────────────────
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Diseases = lazy(() => import('./pages/Diseases'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Predict = lazy(() => import('./pages/Predict'));
const PredictionResult = lazy(() => import('./pages/PredictionResult'));

// Patient Dashboard
const PatientDashboard = lazy(() => import('./pages/dashboard/patient/PatientDashboard'));
const PatientPredictions = lazy(() => import('./pages/dashboard/patient/PatientPredictions'));
const PatientAppointments = lazy(() => import('./pages/dashboard/patient/PatientAppointments'));
const PatientProfile = lazy(() => import('./pages/dashboard/patient/PatientProfile'));

// Doctor Dashboard
const DoctorDashboard = lazy(() => import('./pages/dashboard/doctor/DoctorDashboard'));
const DoctorPatients = lazy(() => import('./pages/dashboard/doctor/DoctorPatients'));
const DoctorReview = lazy(() => import('./pages/dashboard/doctor/DoctorReview'));
const DoctorAppointments = lazy(() => import('./pages/dashboard/doctor/DoctorAppointments'));

// Admin Dashboard
const AdminDashboard = lazy(() => import('./pages/dashboard/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/dashboard/admin/AdminUsers'));
const AdminPredictions = lazy(() => import('./pages/dashboard/admin/AdminPredictions'));
const AdminMessages = lazy(() => import('./pages/dashboard/admin/AdminMessages'));

// Error Pages
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * Dashboard redirect — sends users to their role-specific dashboard.
 */
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const paths = {
    patient: '/dashboard/patient',
    doctor: '/dashboard/doctor',
    admin: '/dashboard/admin',
  };
  return <Navigate to={paths[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public Pages (with Navbar + Footer) ──────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/diseases" element={<Diseases />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ── Protected Pages (with Navbar + Footer) ───────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/predict" element={
            <ProtectedRoute><Predict /></ProtectedRoute>
          } />
          <Route path="/predictions/:id" element={
            <ProtectedRoute><PredictionResult /></ProtectedRoute>
          } />
        </Route>

        {/* ── Dashboard Redirect ───────────────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRedirect /></ProtectedRoute>
        } />

        {/* ── Patient Dashboard ────────────────────────────────────── */}
        <Route path="/dashboard/patient" element={
          <ProtectedRoute roles={['patient']}><DashboardLayout role="patient" /></ProtectedRoute>
        }>
          <Route index element={<PatientDashboard />} />
          <Route path="predictions" element={<PatientPredictions />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        {/* ── Doctor Dashboard ─────────────────────────────────────── */}
        <Route path="/dashboard/doctor" element={
          <ProtectedRoute roles={['doctor', 'admin']}><DashboardLayout role="doctor" /></ProtectedRoute>
        }>
          <Route index element={<DoctorDashboard />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="review/:predictionId" element={<DoctorReview />} />
          <Route path="appointments" element={<DoctorAppointments />} />
        </Route>

        {/* ── Admin Dashboard ──────────────────────────────────────── */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute roles={['admin']}><DashboardLayout role="admin" /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="predictions" element={<AdminPredictions />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>

        {/* ── 404 ──────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

/**
 * Public layout — wraps pages with Navbar + Footer.
 */
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
