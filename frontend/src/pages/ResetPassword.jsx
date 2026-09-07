import { useForm } from 'react-hook-form';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../api/endpoints';
import AnimatedPage from '../components/AnimatedPage';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const token = params.get('token');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    if (!token) { toast.error('Invalid reset token.'); return; }
    try {
      await authAPI.resetPassword({ token, new_password: data.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed.');
    }
  };

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your new password below.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                })}
                className="input-field !pl-11 !pr-11"
                placeholder="New password"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </AnimatedPage>
  );
}
