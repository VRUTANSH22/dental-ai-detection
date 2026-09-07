import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api/endpoints';
import AnimatedPage from '../components/AnimatedPage';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm();

  const onSubmit = async (data) => {
    try {
      await authAPI.forgotPassword(data.email);
      toast.success('If an account exists, a reset link has been sent.');
    } catch {
      toast.success('If an account exists, a reset link has been sent.');
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password?</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your email and we&apos;ll send a reset link.</p>

          {isSubmitSuccessful ? (
            <div className="text-center py-6">
              <Mail className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-300 font-medium">Check your email for a reset link.</p>
              <Link to="/login" className="btn-ghost mt-4 inline-flex">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input-field !pl-11"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
              <Link to="/login" className="btn-ghost w-full justify-center text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
