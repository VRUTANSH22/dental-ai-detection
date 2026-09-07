/**
 * Doctor Appointments — manage patient appointment requests.
 */
import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, X, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorAPI, appointmentAPI } from '../../../api/endpoints';
import { APPOINTMENT_STATUS } from '../../../utils/constants';
import EmptyState from '../../../components/EmptyState';
import AnimatedPage from '../../../components/AnimatedPage';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    doctorAPI.getAppointments()
      .then(({ data }) => setAppointments(data.appointments || data || []))
      .catch(() => toast.error('Failed to load appointments.'))
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await appointmentAPI.update(id, { status });
      toast.success(`Appointment ${status}.`);
      loadAppointments();
    } catch {
      toast.error('Failed to update appointment.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Appointments</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="You don't have any appointments yet." />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const statusInfo = APPOINTMENT_STATUS[apt.status] || { label: apt.status, class: 'badge-info' };
            return (
              <div key={apt.id || apt._id} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {apt.patient_name || 'Patient'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(apt.appointment_date).toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      {apt.reason && (
                        <p className="text-xs text-slate-400 mt-1">Reason: {apt.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={statusInfo.class}>{statusInfo.label}</span>

                    {apt.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(apt.id || apt._id, 'confirmed')}
                          disabled={updating === (apt.id || apt._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors"
                        >
                          {updating === (apt.id || apt._id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id || apt._id, 'rejected')}
                          disabled={updating === (apt.id || apt._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}

                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(apt.id || apt._id, 'completed')}
                        disabled={updating === (apt.id || apt._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 transition-colors"
                      >
                        {updating === (apt.id || apt._id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}
