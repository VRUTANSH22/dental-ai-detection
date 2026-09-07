import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, CheckCircle, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { appointmentAPI } from '../../../api/endpoints';
import { APPOINTMENT_STATUS } from '../../../utils/constants';
import EmptyState from '../../../components/EmptyState';
import AnimatedPage from '../../../components/AnimatedPage';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    loadAppointments();
    appointmentAPI.getAvailableDoctors()
      .then(({ data }) => setDoctors(data || []))
      .catch(() => {});
  }, []);

  const loadAppointments = () => {
    appointmentAPI.getAll()
      .then(({ data }) => setAppointments(data.appointments || data || []))
      .catch(() => toast.error('Failed to load appointments.'))
      .finally(() => setLoading(false));
  };

  const onSubmit = async (data) => {
    try {
      await appointmentAPI.book(data);
      toast.success('Appointment booked successfully!');
      reset();
      setShowForm(false);
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book appointment.');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled.');
      loadAppointments();
    } catch {
      toast.error('Failed to cancel.');
    }
  };

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Appointments</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Book New
        </button>
      </div>

      {/* Book Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Book Appointment</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doctor</label>
              <select {...register('doctor_id', { required: true })} className="input-field">
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>{d.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time</label>
              <input type="datetime-local" {...register('appointment_date', { required: true })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (optional)</label>
              <textarea {...register('reason')} className="input-field min-h-[80px] resize-none" placeholder="Describe your dental concern..." />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Book Appointment
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="Book your first dental appointment." />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const statusInfo = APPOINTMENT_STATUS[apt.status] || { label: apt.status, class: 'badge-info' };
            return (
              <div key={apt.id || apt._id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Dr. {apt.doctor_name || 'TBD'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={statusInfo.class}>{statusInfo.label}</span>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <button onClick={() => cancelAppointment(apt.id || apt._id)} className="btn-ghost text-red-600 text-sm">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
