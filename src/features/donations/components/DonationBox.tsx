import {
    ArrowRight,
    CaretDown,
    CaretUp,
    CurrencyInr,
    EyeSlash,
    Info,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import ToggleSwitch from '@/shared/components/ToggleSwitch.tsx';
import { Button } from '@/shared/components/ui/button.tsx';
import { Input } from '@/shared/components/ui/input.tsx';
import { Textarea } from '@/shared/components/ui/textarea.tsx';
import instructions from '@/shared/data/donationInstructions.ts';

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
        if (!amount || amount < 50)
            return toast.error(
                'Please enter or select a valid contribution amount!'
            );

        containerRef?.current?.scrollTo({ behavior: 'smooth' });
        setAmount(amount);
        setShowQR(true);
        setStep('utr');
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* Header Title */}
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-chart-1">
                    TERMINAL // STEP 01
                </p>
                <h2 className="font-grotesk text-2xl font-black tracking-tight text-foreground">
                    Configure Contribution
                </h2>
            </div>

            {/* Collapsible Guidelines / Instructions */}
            <div className="overflow-hidden border border-border bg-muted/50 transition-all">
                <button
                    type="button"
                    onClick={() => setInstructionOpen(!instructionOpen)}
                    className="flex w-full items-center justify-between p-4 text-left transition hover:bg-accent/50"
                >
                    <div className="flex items-center gap-2.5">
                        <Info size={18} className="text-chart-1" />
                        <span className="font-grotesk text-xs font-bold uppercase tracking-wider text-foreground">
                            Protocol Instructions & Verification Guidelines
                        </span>
                    </div>
                    <div className="bg-muted p-1 text-muted-foreground">
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
                            className="border-t border-border p-4 pt-3"
                        >
                            <ol className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                                {instructions.map((item, idx) => (
                                    <li key={idx} className="flex gap-2.5">
                                        <span className="font-mono text-[10px] font-bold text-chart-1">
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
                                                                className="text-[11px] text-muted-foreground/70"
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
                    <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Select Amount (INR)
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
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
                                className={`group relative flex items-center justify-center border py-3 font-mono text-base font-bold transition-all ${
                                    isSelected
                                        ? 'border-chart-1 bg-chart-1 text-white shadow-md shadow-chart-1/20'
                                        : 'border-border bg-card text-foreground hover:border-muted-foreground/40 hover:bg-accent/50'
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
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={amount || ''}
                        onChange={(e) =>
                            setAmount(parseFloat(e.target.value) || 0)
                        }
                        className="h-11 rounded-none border-border bg-card pl-10 font-mono text-sm font-semibold text-foreground placeholder:text-muted-foreground transition focus:border-chart-1 focus:ring-1 focus:ring-chart-1"
                    />
                </div>

                {amount && amount > 0 && amount < 50 && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                        ₹50 minimum. I'd genuinely rather you keep ₹{amount}{' '}
                        than donate it. 😭
                    </p>
                )}
            </div>

            {/* Optional Note / Message */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Public Message (Optional)
                    </label>
                    <span className="font-mono text-[10px] text-muted-foreground/70">
                        {(message || '').length}/100
                    </span>
                </div>
                <Textarea
                    placeholder="Leave a encouraging note or feedback..."
                    maxLength={100}
                    value={message || ''}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-24 resize-none rounded-none border-border bg-card font-serif text-sm text-foreground placeholder:text-muted-foreground transition focus:border-chart-1 focus:ring-1 focus:ring-chart-1"
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
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-none bg-chart-1 font-grotesk text-sm font-bold text-white transition-all hover:bg-chart-1/90 hover:shadow-lg hover:shadow-chart-1/25 active:scale-[0.99]"
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
