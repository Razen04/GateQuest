import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';

const ReportModal = ({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (type: string, reason: string) => void;
}) => {
    const [reportType, setReportType] = useState('');
    const [reportText, setReportText] = useState('');

    const reasons = [
        'Error in question',
        'Error in options',
        'Error in answer',
        'Error in tags',
        'Other',
    ];

    const handleSubmit = () => {
        if (reportType === 'Other') {
            // If "Other", submit the custom text if provided
            onSubmit(reportType, reportText.trim() ? reportText : 'Other');
        } else {
            onSubmit(reportType, '');
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md p-6 relative"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-lg font-bold">Report This Question</h1>
                        <p className="mt-4 text-sm font-light">
                            For multiple just select other field and mention all the issues in the
                            text box.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Dropdown */}
                <select
                    className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-transparent p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                >
                    <option value="" disabled>
                        Select a reason
                    </option>
                    {reasons.map((r, i) => (
                        <option key={i} value={r}>
                            {r}
                        </option>
                    ))}
                </select>

                {/* Optional text field when "Other" is selected */}
                {reportType === 'Other' && (
                    <textarea
                        className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-transparent p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4"
                        placeholder="Please describe the issue..."
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        rows={3}
                    />
                )}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reportType || (reportType === 'Other' && !reportText.trim())}
                        className="px-4 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        Submit
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReportModal;
