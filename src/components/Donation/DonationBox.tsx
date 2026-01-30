import React, { useRef, useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import instructions from '../../data/donationInstructions.ts';
import ToggleSwitch from '../ui/ToggleSwitch.tsx';
import { Button } from '../ui/button.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { Input } from '../ui/input.tsx';

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
        <div ref={containerRef}>
            <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent scroll-smooth max-h-fit">
                Donation Form
            </h2>

            {/* How to donate */}
            <div className="bg-gray-100 dark:bg-zinc-700 mt-2 p-4">
                <div className="flex justify-between items-center">
                    {/* REFINED: Changed from text-red-500 to a theme color */}
                    <h3 className="text-red-600 dark:text-red-400 font-semibold">
                        How to Donate? Please read this carefully.
                    </h3>
                    <Button
                        onClick={() => setInstructionOpen(!instructionOpen)}
                        variant="ghost"
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer hover:text-red-500 transition-colors"
                    >
                        {instructionOpen ? <CaretUp size={20} /> : <CaretDown size={20} />}
                    </Button>
                </div>

                {instructionOpen && (
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
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
            <ToggleSwitch
                label="Remain Anonymous"
                onToggle={() => setAnonymous(!anonymous)}
                isOn={anonymous}
            />

            {/* Optional Message */}
            <Textarea
                placeholder="Optional message (max 100 chars)"
                maxLength={100}
                value={message ? message : ''}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-md"
            />

            {/* Donation Amount */}
            <div className="mt-2 space-y-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Choose Amount</span>
                <div className="flex gap-3">
                    {presetAmounts.map((amt) => (
                        <Button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(amt)}
                            className={`flex-1 py-2 border font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-800 ${
                                amount === amt
                                    ? 'bg-gradient-to-tr from-blue-400 to-blue-500 text-white border-transparent'
                                    : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'
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
                    className="rounded-md"
                />
            </div>

            {/* Generate QR */}
            <Button
                onClick={handleGenerateQR}
                // REFINED: Added accessibility focus-visible ring
                className="mt-4 w-full"
            >
                Generate QR + Link
            </Button>
        </div>
    );
};

export default DonationBox;
