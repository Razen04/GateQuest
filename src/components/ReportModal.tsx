import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { Button } from './ui/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

const ReportModal = ({
    onClose,
    onSubmit,
}: {
    show: boolean;
    onClose: () => void;
    onSubmit: (type: string, reason: string) => void;
}) => {
    const [reportType, setReportType] = useState('');
    const [reportText, setReportText] = useState('');

    const reasons = [
        'Error in question',
        'Error in options',
        'Error in answer',
        'Error in explanation',
        'Error in tags',
        'Other',
    ];

    const handleSubmit = () => {
        onSubmit(reportType, reportText.trim() ? reportText : reportType);
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white dark:bg-neutral-900 shadow-xl w-full max-w-md p-6 relative"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-lg font-bold">Report This Question</h1>
                        <div className="italic text-xs mt-4  text-red-400">
                            <p>
                                Only report if there is a genuine discrepancy, and always refer to
                                GateOverflow as the authoritative source.
                            </p>
                            <p>I follow the answers as they appear there.</p>
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Dropdown */}
                <Select value={reportType} onValueChange={(value) => setReportType(value)}>
                    <SelectTrigger className="w-full mb-2 rounded-md">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Select a reason</SelectLabel>
                            {reasons.map((r, i) => (
                                <SelectItem key={i} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Textarea
                    className="w-full rounded-md"
                    placeholder="Please describe the issue..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={3}
                />

                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        onClick={onClose}
                        className="rounded-md text-sm bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reportType || !reportText.trim()}
                        className="rounded-md text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        Submit
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReportModal;
