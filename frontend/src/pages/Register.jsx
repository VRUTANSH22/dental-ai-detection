/**
 * Registration Page — multi-field form with role selection.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Phone, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AnimatedPage from '../components/AnimatedPage';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a digit'),
  confirm_password: z.string(),
  phone: z.string().optional(),
  role: z.enum(['patient', 'doctor']),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export default function Register() {
  const [showPwd, setShowPwd] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'patient' },
  });

  const onSubmit = async (data) => {
    try {
      const { confirm_password, ...payload } = data;
      await registerUser(payload);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed.');
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-br from-primary-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Join Dental AI for smart dental care
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['patient', 'doctor'].map((role) => (
                  <label
                    key={role}
                    className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/20 border-slate-200 dark:border-slate-700 hover:border-primary-300"
                  >
                    <input type="radio" value={role} {...register('role')} className="sr-only" />
                    {role === 'patient' ? <User className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
                    <span className="font-medium capitalize text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input {...register('full_name')} className="input-field !pl-11" placeholder="Dr. John Doe" />
              </div>
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" {...register('email')} className="input-field !pl-11" placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="tel" {...register('phone')} className="input-field !pl-11" placeholder="+91 98765 43210" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  {...register('password')}
                  className="input-field !pl-11 !pr-11"
                  placeholder="Min 8 chars, uppercase, digit"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" {...register('confirm_password')} className="input-field !pl-11" placeholder="Repeat password" />
              </div>
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Creating Account...' : <><UserPlus className="w-5 h-5" /> Create Account</>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link>
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
}
