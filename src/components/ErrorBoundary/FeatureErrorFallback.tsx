import type { FallbackProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';

export default function FeatureErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[40vh] gap-4 p-8 text-center">
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Something went wrong in this section.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex items-center gap-3 mt-2">
                <button
                    onClick={resetErrorBoundary}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
