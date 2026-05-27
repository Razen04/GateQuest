export default function AppErrorFallback() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-dvh gap-4 p-8 text-center bg-gray-50 dark:bg-zinc-900">
            <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                GATEQuest encountered an error
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                An unexpected error has caused the application to stop. Please refresh to continue.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
                Refresh App
            </button>
        </div>
    );
}
