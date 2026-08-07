import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Crown,
    Heart,
    Receipt,
    ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getUserProfile } from '@/shared/utils/helper';
import DonationBox from '../components/DonationBox';
import DonorList from '../components/DonorList';
import UpiQRCode from '../components/UpiQRCode';
import { useDonations } from '../hooks/useDonations.ts';

// Shared Palette Accents
const signal = '#2A5CFF';

// Kinetic Animated Underline SVG
const HighlightLine = ({ children }: { children: React.ReactNode }) => (
    <span className="relative inline-block">
        {children}
        <motion.svg
            viewBox="0 0 280 18"
            className="pointer-events-none absolute -bottom-1 left-0 h-3 w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <motion.path
                d="M 6 12 Q 140 2 274 10"
                fill="none"
                stroke={signal}
                strokeWidth={4}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
        </motion.svg>
    </span>
);

// Rotating Verification Stamp Around Profile Image
const ProfileBadge = ({ src }: { src: string }) => (
    <div className="relative flex items-center justify-center">
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-3 rounded-full border border-dashed border-[#2A5CFF]/40"
        />
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-900/10 shadow-2xl dark:border-white/20 sm:h-28 sm:w-28">
            <img src={src} alt="Razen" className="h-full w-full object-cover" />
        </div>
    </div>
);

const Donations: React.FC = () => {
    const razenImg = '/razenImg.webp';

    const [amount, setAmount] = useState<number | null>(null);
    const [message, setMessage] = useState<string>('');
    const [anonymous, setAnonymous] = useState<boolean>(false);
    const [utr, setUtr] = useState<string>('');
    const [step, setStep] = useState<
        'form' | 'generateQR' | 'utr' | 'thankYou'
    >('form');
    const [showQR, setShowQR] = useState<boolean>(false);

    const userProfile = getUserProfile();
    const userId = userProfile
        ? userProfile.id !== '1'
            ? userProfile.id
            : null
        : null;

    const { donations, loading, addDonation, loadDonations } = useDonations();

    useEffect(() => {
        loadDonations();
    }, [loadDonations]);

    const handleUTRSubmit = async () => {
        if (!utr)
            return toast.warning('Please enter the 12-digit UTR / Ref Number');
        try {
            await addDonation({
                userId,
                amount: amount!,
                message,
                anonymous,
                utr,
            });
            setStep('thankYou');
            setMessage('');
            setAnonymous(false);
            setAmount(null);
            setUtr('');
            toast.success('Patronage logged! Thank you for the support.');
        } catch (err) {
            console.error('error submitting donation: ', err);
            toast.error('Unable to verify transaction. Try again.');
        }
    };

    const maxAmount =
        donations.length > 0
            ? Math.max(...donations.map((d) => d.actual_amount))
            : 0;
    const topDonor = donations.filter((d) => d.actual_amount === maxAmount);

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden pb-20 bg-[#F4F5F1] font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 transition-colors duration-500 dark:bg-[#0B0C10] dark:text-slate-200">
            {/* Watermark Section Header */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-10 -z-0 overflow-hidden opacity-[0.03] dark:opacity-[0.05]"
            >
                <div className="whitespace-nowrap font-['Space_Grotesk',sans-serif] text-[12vw] font-black uppercase leading-none text-slate-900 dark:text-white">
                    PATRONAGE // REVENUE MANIFEST
                </div>
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-8">
                {/* ── HEADER / CREATOR DOSSIER ── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-12 overflow-hidden border border-slate-900/10 bg-white/70 p-6 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] sm:p-10"
                >
                    <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                        <ProfileBadge src={razenImg} />

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                <span className="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.25em] text-[#2A5CFF]">
                                    DOSSIER // RAZEN
                                </span>
                                <span className="bg-[#1FAA6D]/10 px-2.5 py-0.5 font-['JetBrains_Mono',monospace] text-[9px] font-bold text-[#1FAA6D]">
                                    INDEPENDENT CREATOR
                                </span>
                            </div>

                            <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-3xl font-black tracking-tight sm:text-4xl">
                                Fueling open engineering &{' '}
                                <span className="font-['Fraunces',serif] font-normal italic text-[#2A5CFF]">
                                    <HighlightLine>
                                        project build-outs.
                                    </HighlightLine>
                                </span>
                            </h1>

                            <p className="mt-3 max-w-2xl font-['Fraunces',serif] text-base leading-relaxed text-slate-600 dark:text-white/70">
                                Direct contributions keep the platform alive and
                                development continuous. Every contribution is
                                publicly recorded on the ledger.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* ── MAIN TWO-COLUMN LAYOUT ── */}
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* LEFT COLUMN: PAYMENT TERMINAL */}
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative flex flex-col justify-between border border-slate-900/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#12151B] sm:p-8"
                    >
                        {/* Terminal Header */}
                        <div className="mb-6 flex items-center justify-between border-b border-slate-900/10 pb-4 dark:border-white/10">
                            <div>
                                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    STEP{' '}
                                    {step === 'form'
                                        ? '01/02'
                                        : step === 'utr'
                                          ? '02/02'
                                          : 'COMPLETE'}
                                </span>
                                <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-bold">
                                    {step === 'form' && 'Select Contribution'}
                                    {step === 'utr' && 'Verify UPI Payment'}
                                    {step === 'thankYou' && 'Receipt Confirmed'}
                                </h2>
                            </div>
                            <Receipt className="h-6 w-6 text-[#2A5CFF]" />
                        </div>

                        {/* Interactive Steps */}
                        <AnimatePresence mode="wait">
                            {step === 'form' && (
                                <motion.div
                                    key="step-form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <DonationBox
                                        setStep={setStep}
                                        amount={amount}
                                        message={message}
                                        anonymous={anonymous}
                                        setMessage={setMessage}
                                        setAmount={setAmount}
                                        setAnonymous={setAnonymous}
                                        setShowQR={setShowQR}
                                    />
                                </motion.div>
                            )}

                            {step === 'utr' && showQR && (
                                <motion.div
                                    key="step-utr"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6 text-center"
                                >
                                    <div className="border border-slate-900/10 bg-[#F4F5F1] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                        <UpiQRCode amount={amount} />
                                    </div>

                                    <div className="text-left space-y-2">
                                        <label className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-slate-400">
                                            12-Digit Reference / UTR Number
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 4029XXXX1234"
                                            value={utr}
                                            onChange={(e) =>
                                                setUtr(e.target.value)
                                            }
                                            className="w-full border border-slate-900/20 bg-slate-50 p-3.5 font-['JetBrains_Mono',monospace] text-sm font-semibold outline-none transition focus:border-[#2A5CFF] focus:ring-2 focus:ring-[#2A5CFF]/20 dark:border-white/20 dark:bg-white/5 dark:text-white"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Locate the UTR number in your UPI
                                            app receipt after payment.
                                        </p>
                                    </div>

                                    {/* Proof Screenshot Guide thumbnail */}
                                    <div className="overflow-hidden border border-slate-900/10 dark:border-white/10">
                                        <img
                                            src="/screenshots/tidscreenshot.jpeg"
                                            alt="UTR Guide"
                                            className="mx-auto w-full object-cover opacity-80 transition hover:opacity-100"
                                        />
                                    </div>

                                    <button
                                        onClick={handleUTRSubmit}
                                        className="flex w-full items-center justify-center gap-2 bg-[#1FAA6D] py-3.5 font-['Space_Grotesk',sans-serif] font-bold text-white transition hover:bg-[#1FAA6D]/90 shadow-lg shadow-[#1FAA6D]/20"
                                    >
                                        Submit Transaction for Verification
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            )}

                            {step === 'thankYou' && (
                                <motion.div
                                    key="step-thanks"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8 text-center space-y-4"
                                >
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#1FAA6D]/10 text-[#1FAA6D]">
                                        <CheckCircle2 className="h-10 w-10" />
                                    </div>

                                    <h3 className="font-['Space_Grotesk',sans-serif] text-2xl font-black">
                                        Patronage Recorded
                                    </h3>

                                    <p className="font-['Fraunces',serif] text-base text-slate-600 dark:text-white/70">
                                        Your reference submission is being
                                        processed. It will reflect on the live
                                        donor ledger shortly.
                                    </p>

                                    <button
                                        onClick={() => setStep('form')}
                                        className="mt-4 border border-slate-900/20 px-6 py-2.5 font-['Space_Grotesk',sans-serif] text-sm font-bold transition hover:bg-slate-100 dark:border-white/20 dark:hover:bg-white/10"
                                    >
                                        Submit Another Entry
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Guarantee */}
                        <div className="mt-8 flex items-center justify-between border-t border-slate-900/10 pt-4 font-['JetBrains_Mono',monospace] text-[10px] text-slate-400 dark:border-white/10">
                            <span>ENCRYPTED DIRECT UPI</span>
                            <span className="flex items-center gap-1 text-[#1FAA6D]">
                                <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED
                                RECEIVER
                            </span>
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: PUBLIC PATRON LEDGER */}
                    <motion.div
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col gap-6"
                    >
                        <div>
                            <div className="flex items-center justify-between">
                                <p className="font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-[0.25em] text-[#2A5CFF]">
                                    EXHIBIT C // LIVE LEDGER
                                </p>
                                <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-slate-400">
                                    {donations.length} RECORDED
                                </span>
                            </div>
                            <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-black">
                                Hall of Patrons
                            </h2>
                        </div>

                        {donations.length > 0 && !loading ? (
                            <div className="space-y-6">
                                {/* Top Patron Feature Card */}
                                {topDonor.length > 0 && (
                                    <div className="relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-5 backdrop-blur-md">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                                <Crown className="h-3.5 w-3.5" />{' '}
                                                TOP BENEFACTOR
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <DonorList donations={topDonor} />
                                        </div>
                                    </div>
                                )}

                                {/* Main Donor List */}
                                <div className="border border-slate-900/10 bg-white/50 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.02]">
                                    <h3 className="mb-3 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-slate-400">
                                        All Contributor Logs
                                    </h3>
                                    <div className="max-h-[420px] overflow-y-auto pr-1">
                                        <DonorList donations={donations} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center border border-dashed border-slate-900/20 p-12 text-center dark:border-white/20">
                                <Heart className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                <p className="mt-3 font-['Fraunces',serif] text-sm text-slate-500 dark:text-slate-400">
                                    No public records on the manifest yet. Be
                                    the founding patron.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </main>
    );
};

export default Donations;
