/**
 * Animated loading spinner with dental theme.
 */
import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeMap[size]} text-primary-500 animate-spin`} />
      {size === 'lg' || size === 'xl' ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          Loading...
        </p>
      ) : null}
    </div>
  );
}
