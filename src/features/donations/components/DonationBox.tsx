import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CaretDown,
    CaretUp,
    ArrowRight,
    CurrencyInr,
    Info,
    EyeSlash,
} from '@phosphor-icons/react';
import instructions from '@/shared/data/donationInstructions.ts';
import ToggleSwitch from '@/shared/components/ToggleSwitch.tsx';
import { Button } from '@/shared/components/ui/button.tsx';
import { Textarea } from '@/shared/components/ui/textarea.tsx';
import { Input } from '@/shared/components/ui/input.tsx';

type DonationBoxProps = {
    setStep: React.Dispatch<
        React.SetStateAction<'form' | 'generateQR' | 'utr' | 'thankYou'>
    >;
    amount: number | null;
    message: string | null;
    anonymous: boolean;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    setAmount: React.Dispatch<React.SetStateAction<number | null>>;
    setAnonymous: React.Dispatch<React.SetStateAction<boolean>>;
    setShowQR: React.Dispatch<React.SetStateAction<boolean>>;
};

const presetAmounts = [50, 169, 569];

const DonationBox: React.FC<DonationBoxProps> = ({
    setStep,
    amount,
    message,
    anonymous,
    setMessage,
    setAmount,
    setAnonymous,
    setShowQR,
}) => {
    const [instructionOpen, setInstructionOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleGenerateQR = () => {
        if (!amount || amount <= 0)
            return alert('Please enter or select a valid contribution amount!');

        containerRef?.current?.scrollTo({ behavior: 'smooth' });
        setAmount(amount);
        setShowQR(true);
        setStep('utr');
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Header Title */}
            <div>
                <p className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.25em] text-[#2A5CFF]">
                    TERMINAL // STEP 01
                </p>
                <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Configure Contribution
                </h2>
            </div>

            {/* Collapsible Guidelines / Instructions */}
            <div className="overflow-hidden border border-slate-900/10 bg-slate-50/50 transition-all dark:border-white/10 dark:bg-white/[0.02]">
                <button
                    type="button"
                    onClick={() => setInstructionOpen(!instructionOpen)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-slate-100/50 dark:hover:bg-white/[0.03]"
                >
                    <div className="flex items-center gap-2.5">
                        <Info size={18} className="text-[#2A5CFF]" />
                        <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Protocol Instructions & Verification Guidelines
                        </span>
                    </div>
                    <div className="bg-slate-200/50 p-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {instructionOpen ? (
                            <CaretUp size={14} />
                        ) : (
                            <CaretDown size={14} />
                        )}
                    </div>
                </button>

                <AnimatePresence>
                    {instructionOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="border-t border-slate-900/10 p-4 pt-3 dark:border-white/10"
                        >
                            <ol className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {instructions.map((item, idx) => (
                                    <li key={idx} className="flex gap-2.5">
                                        <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#2A5CFF]">
                                            0{idx + 1}.
                                        </span>
                                        <div>
                                            <p>{item.text}</p>
                                            {item.sub && (
                                                <ul className="mt-1.5 space-y-1 pl-2">
                                                    {item.sub.map(
                                                        (sub, subIdx) => (
                                                            <li
                                                                key={subIdx}
                                                                className="text-[11px] text-slate-500 dark:text-slate-400"
                                                            >
                                                                &bull;{' '}
                                                                {sub.text}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Select Amount Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Select Amount (INR)
                    </label>
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-400">
                        INSTANT UPI RECEPTION
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    {presetAmounts.map((amt) => {
                        const isSelected = amount === amt;
                        return (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setAmount(amt)}
                                className={`group relative flex items-center justify-center border py-3 font-['JetBrains_Mono',monospace] text-base font-bold transition-all ${
                                    isSelected
                                        ? 'border-[#2A5CFF] bg-[#2A5CFF] text-white shadow-md shadow-[#2A5CFF]/20'
                                        : 'border-slate-900/10 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:border-white/30'
                                }`}
                            >
                                ₹{amt}
                            </button>
                        );
                    })}
                </div>

                {/* Custom Amount Input */}
                <div className="relative">
                    <CurrencyInr
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={amount || ''}
                        onChange={(e) =>
                            setAmount(parseFloat(e.target.value) || 0)
                        }
                        className="h-11 rounded-none border-slate-900/10 bg-white pl-10 font-['JetBrains_Mono',monospace] text-sm font-semibold text-slate-900 transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                    />
                </div>

                {amount && amount > 0 && amount < 50 && (
                    <p className="mt-2 text-sm font-medium text-red-500">
                        ₹50 minimum. I'd genuinely rather you keep ₹{amount}{' '}
                        than donate it. 😭
                    </p>
                )}
            </div>

            {/* Optional Note / Message */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Public Message (Optional)
                    </label>
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] text-slate-400">
                        {(message || '').length}/100
                    </span>
                </div>
                <Textarea
                    placeholder="Leave a encouraging note or feedback..."
                    maxLength={100}
                    value={message || ''}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-24 resize-none rounded-none border-slate-900/10 bg-white font-['Fraunces',serif] text-sm text-slate-900 transition focus:border-[#2A5CFF] focus:ring-1 focus:ring-[#2A5CFF] dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
            </div>

            {/* Anonymous Toggle Option */}
            <ToggleSwitch
                icon={<EyeSlash size={20} />}
                title="Anonymous Contribution"
                description="Hide your profile details on the public patron log"
                isOn={anonymous}
                onToggle={() => setAnonymous(!anonymous)}
            />

            {/* Submit & Generate QR CTA */}
            <Button
                type="button"
                onClick={handleGenerateQR}
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-none bg-[#2A5CFF] font-['Space_Grotesk',sans-serif] text-sm font-bold text-white transition-all hover:bg-[#2A5CFF]/90 hover:shadow-lg hover:shadow-[#2A5CFF]/25 active:scale-[0.99]"
            >
                Generate Dynamic QR Code
                <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                />
            </Button>
        </div>
    );
};

export default DonationBox;
