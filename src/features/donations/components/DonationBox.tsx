import React, { useRef, useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import instructions from '@/shared/data/donationInstructions.ts';
import ToggleSwitch from '@/shared/components/ToggleSwitch.tsx';
import { Button } from '@/shared/components/ui/button.tsx';
import { Textarea } from '@/shared/components/ui/textarea.tsx';
import { Input } from '@/shared/components/ui/input.tsx';

type DonationBoxProps = {
    setStep: React.Dispatch<React.SetStateAction<'form' | 'generateQR' | 'utr' | 'thankYou'>>;
    amount: number | null;
    message: string | null;
    anonymous: boolean;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    setAmount: React.Dispatch<React.SetStateAction<number | null>>;
    setAnonymous: React.Dispatch<React.SetStateAction<boolean>>;
    setShowQR: React.Dispatch<React.SetStateAction<boolean>>;
};

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
    const [instructionOpen, setInstructionOpen] = useState<boolean>(true); // if the instruction is opened or not

    const containerRef = useRef<HTMLDivElement | null>(null);

    // Donation amount buttons
    const presetAmounts = [20, 69, 169];

    // Handle QR generation step
    const handleGenerateQR = () => {
        const finalAmount = amount;
        if (!finalAmount) return alert('Select or enter an amount!');

        containerRef?.current?.scrollTo({ behavior: 'smooth' });

        setAmount(finalAmount);
        setShowQR(true);
        setStep('utr');
    };

    return (
        <div ref={containerRef} className="space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent scroll-smooth">
                Donation Form
            </h2>

            {/* How to donate */}
            <div className="relative overflow-hidden rounded-2xl p-4 border border-white/20 bg-white/10 backdrop-blur-xl backdrop-saturate-150 dark:bg-white/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

                <div className="relative flex justify-between items-center">
                    <h3 className="text-red-600 dark:text-red-400 font-semibold text-sm">
                        How to Donate? Please read this carefully.
                    </h3>

                    <Button
                        onClick={() => setInstructionOpen(!instructionOpen)}
                        variant="ghost"
                        className="rounded-full p-2 hover:bg-white/20 dark:hover:bg-white/10"
                    >
                        {instructionOpen ? <CaretUp size={18} /> : <CaretDown size={18} />}
                    </Button>
                </div>

                {instructionOpen && (
                    <ol className="relative mt-3 list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        {instructions.map((item, idx) => (
                            <li key={idx}>
                                {item.text}

                                {item.sub && (
                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                        {item.sub.map((sub, subIdx) => (
                                            <li key={subIdx}>{sub.text}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {/* Anonymous toggle */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl dark:bg-white/[0.06] p-3">
                <ToggleSwitch
                    label="Remain Anonymous"
                    onToggle={() => setAnonymous(!anonymous)}
                    isOn={anonymous}
                />
            </div>

            {/* Optional Message */}
            <Textarea
                placeholder="Optional message (max 100 chars)"
                maxLength={100}
                value={message ? message : ''}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-2xl border-white/20 bg-white/10 backdrop-blur-xl dark:bg-white/[0.06] min-h-24"
            />

            {/* Donation Amount */}
            <div className="space-y-3">
                <span className="font-medium text-sm text-muted-foreground">Choose Amount</span>

                <div className="flex gap-2">
                    {presetAmounts.map((amt) => (
                        <Button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt)}
                            className={`flex-1 rounded-xl transition-all ${
                                amount === amt
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-white/10 dark:bg-white/[0.06] border border-white/20 hover:bg-white/20 dark:hover:bg-white/10'
                            }`}
                        >
                            ₹{amt}
                        </Button>
                    ))}
                </div>

                <Input
                    type="number"
                    placeholder="Custom amount"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-2xl bg-white/10 border-white/20 backdrop-blur-xl dark:bg-white/[0.06]"
                />
            </div>

            {/* Generate QR */}
            <Button
                onClick={handleGenerateQR}
                className="w-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-700 shadow-lg"
            >
                Generate QR + Link
            </Button>
        </div>
    );
};

export default DonationBox;
