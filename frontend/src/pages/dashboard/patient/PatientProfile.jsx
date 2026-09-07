import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientAPI } from '../../../api/endpoints';
import { useAuth } from '../../../context/AuthContext';
import AnimatedPage from '../../../components/AnimatedPage';

export default function PatientProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    patientAPI.getProfile()
      .then(({ data }) => {
        reset({ full_name: data.full_name, phone: data.phone || '', address: data.address || '' });
      })
      .catch(() => {
        if (user) reset({ full_name: user.full_name, phone: '', address: '' });
      })
      .finally(() => setLoading(false));
  }, [reset, user]);

  const onSubmit = async (data) => {
    try {
      const { data: updated } = await patientAPI.updateProfile(data);
      updateUser(data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">My Profile</h1>

      <div className="card p-8 max-w-2xl">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="badge-info text-xs mt-1">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input {...register('full_name')} className="input-field !pl-11" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input {...register('phone')} className="input-field !pl-11" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
            <textarea {...register('address')} className="input-field min-h-[80px] resize-none" placeholder="Your address" />
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </form>
      </div>
    </AnimatedPage>
  );
}
