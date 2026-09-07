import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../api/endpoints';
import AnimatedPage from '../components/AnimatedPage';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const token = params.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AnimatedPage className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="card p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold">Verifying your email...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email Verified!</h1>
            <p className="text-slate-500 mb-6">Your account has been verified. You can now log in.</p>
            <Link to="/login" className="btn-primary">Go to Login</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verification Failed</h1>
            <p className="text-slate-500 mb-6">The verification link is invalid or has expired.</p>
            <Link to="/login" className="btn-primary">Go to Login</Link>
          </>
        )}
      </div>
    </AnimatedPage>
  );
}
