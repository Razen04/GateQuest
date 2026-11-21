import {
    ArrowRightIcon,
    CheckCircleIcon,
    CoinsIcon,
    CrownIcon,
    HeartIcon,
    ReceiptIcon,
    ShieldCheckIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/stores/useAuthStore.ts';
import AnimatedTabs, { type TabItem } from '@/shared/components/AnimatedTabs';
import DonationBox from '../components/DonationBox';
import DonorList from '../components/DonorList';
import Mission from '../components/Mission.tsx';
import UpiQRCode from '../components/UpiQRCode';
import { useDonations } from '../hooks/useDonations.ts';

type TabId = 'mission' | 'contribute';

const Donations: React.FC = () => {
    const razenImg = '/razenImg.webp';

    const [activeTab, setActiveTab] = useState<TabId>('mission');

    const [amount, setAmount] = useState<number | null>(null);
    const [message, setMessage] = useState<string>('');
    const [anonymous, setAnonymous] = useState<boolean>(false);
    const [utr, setUtr] = useState<string>('');
    const [step, setStep] = useState<
        'form' | 'generateQR' | 'utr' | 'thankYou'
    >('form');
    const [showQR, setShowQR] = useState<boolean>(false);

    const userId = useAuthStore((s) =>
        s.user && s.user.id !== '1' ? s.user.id : null
    );

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

    const tabs: TabItem[] = [
        {
            id: 'mission',
            label: 'The Mission',
            icon: <HeartIcon size={15} />,
            activeIcon: <HeartIcon size={15} fill="currentColor" />,
        },
        {
            id: 'contribute',
            label: 'Contribute',
            icon: <CoinsIcon size={15} />,
            activeIcon: <CoinsIcon size={15} />,
        },
    ];

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden pb-20 bg-background font-sans text-foreground transition-colors duration-500">
            <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-8">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-8 overflow-hidden border border-border bg-card/70 p-6 backdrop-blur-md sm:p-10"
                >
                    <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                        <img src={razenImg} className="w-24 rounded-full" />

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-chart-1">
                                    RAZEN
                                </span>
                                <span className="bg-chart-2/10 px-2.5 py-0.5 font-mono text-[9px] font-bold text-chart-2">
                                    INDEPENDENT CREATOR
                                </span>
                            </div>

                            <h1 className="mt-2 font-grotesk text-3xl font-black tracking-tight sm:text-4xl">
                                Trying to do better by building something useful
                            </h1>

                            <p className="mt-3 max-w-2xl font-serif text-base leading-relaxed text-muted-foreground">
                                Direct contributions keep the platform alive and
                                development continuous. Every contribution is
                                publicly recorded on the ledger.
                            </p>
                        </div>
                    </div>
                </motion.section>

                <AnimatedTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as TabId)}
                    className="mb-8"
                />

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    {activeTab === 'mission' && <Mission />}

                    {activeTab === 'contribute' && (
                        <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                            {/* Payment terminal */}
                            <motion.div
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="relative min-w-0 flex flex-col justify-between border border-border bg-card p-6 shadow-xl sm:p-8"
                            >
                                {/* Terminal Header */}
                                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                                    <div>
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            STEP{' '}
                                            {step === 'form'
                                                ? '01/02'
                                                : step === 'utr'
                                                  ? '02/02'
                                                  : 'COMPLETE'}
                                        </span>
                                        <h2 className="font-grotesk text-xl font-bold">
                                            {step === 'form' &&
                                                'Select Contribution'}
                                            {step === 'utr' &&
                                                'Verify UPI Payment'}
                                            {step === 'thankYou' &&
                                                'Receipt Confirmed'}
                                        </h2>
                                    </div>
                                    <ReceiptIcon className="h-6 w-6 text-chart-1" />
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
                                            <div className="border border-border bg-background p-4">
                                                <UpiQRCode amount={amount} />
                                            </div>

                                            <div className="text-left space-y-2">
                                                <label className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    12-Digit Reference / UTR
                                                    Number
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 4029XXXX1234"
                                                    value={utr}
                                                    onChange={(e) =>
                                                        setUtr(e.target.value)
                                                    }
                                                    className="w-full border border-border bg-background p-3.5 font-mono text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none transition focus:border-chart-1 focus:ring-2 focus:ring-chart-1/20"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Locate the UTR number in
                                                    your UPI app receipt after
                                                    payment.
                                                </p>
                                            </div>

                                            <div className="overflow-hidden border border-border">
                                                <img
                                                    src="/screenshots/tidscreenshot.jpeg"
                                                    alt="UTR Guide"
                                                    className="mx-auto w-full object-cover opacity-80 transition hover:opacity-100"
                                                />
                                            </div>

                                            <button
                                                onClick={handleUTRSubmit}
                                                className="flex w-full items-center justify-center gap-2 bg-chart-2 py-3.5 font-grotesk font-bold text-white shadow-lg shadow-chart-2/20 transition hover:bg-chart-2/90"
                                            >
                                                Submit Transaction for
                                                Verification
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'thankYou' && (
                                        <motion.div
                                            key="step-thanks"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.95,
                                            }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="py-8 text-center space-y-4"
                                        >
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-chart-2/10 text-chart-2">
                                                <CheckCircleIcon className="h-10 w-10" />
                                            </div>

                                            <h3 className="font-grotesk text-2xl font-black">
                                                Patronage Recorded
                                            </h3>

                                            <p className="text-base text-muted-foreground">
                                                Your reference submission is
                                                being processed. It will reflect
                                                on the live donor ledger
                                                shortly.
                                            </p>

                                            <button
                                                onClick={() => setStep('form')}
                                                className="mt-4 border border-border px-6 py-2.5 font-grotesk text-sm font-bold transition hover:bg-accent hover:text-accent-foreground"
                                            >
                                                Submit Another Entry
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Footer Guarantee */}
                                <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-mono text-[10px] text-muted-foreground">
                                    <span>DIRECT UPI</span>
                                    <span className="flex items-center gap-1 text-chart-2">
                                        <ShieldCheckIcon className="h-3.5 w-3.5" />{' '}
                                        VERIFIED RECEIVER
                                    </span>
                                </div>
                            </motion.div>

                            {/* Patrons ledger */}
                            <motion.div
                                initial={{ opacity: 0, x: 15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="flex flex-col gap-6 min-w-0"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-chart-1">
                                            LIVE LEDGER
                                        </p>
                                        <span className="font-mono text-xs font-bold text-muted-foreground">
                                            {donations.length} RECORDED
                                        </span>
                                    </div>
                                    <h2 className="mt-1 font-grotesk text-2xl font-black">
                                        Hall of Patrons
                                    </h2>
                                </div>

                                {donations.length > 0 && !loading ? (
                                    <div className="space-y-6">
                                        {/* Top Patron Feature Card */}
                                        {topDonor.length > 0 && (
                                            <div className="relative overflow-hidden border border-chart-4/30 bg-gradient-to-br from-chart-4/10 via-transparent to-transparent p-5 backdrop-blur-md">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-widest text-chart-4">
                                                        <CrownIcon className="h-3.5 w-3.5" />{' '}
                                                        TOP BENEFACTOR
                                                    </span>
                                                </div>
                                                <div className="mt-3">
                                                    <DonorList
                                                        donations={topDonor}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Main Donor List */}
                                        <div className="border border-border bg-card/50 p-4 backdrop-blur-md">
                                            <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                All Contributor Logs
                                            </h3>
                                            <div className="max-h-[520px] overflow-y-auto pr-1">
                                                <DonorList
                                                    donations={donations}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center">
                                        <HeartIcon className="h-8 w-8 text-muted-foreground" />
                                        <p className="mt-3 font-serif text-sm text-muted-foreground">
                                            No public records on the manifest
                                            yet. Be the founding patron.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </div>
        </main>
    );
};

export default Donations;
