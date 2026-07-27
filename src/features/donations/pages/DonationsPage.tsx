import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '@/shared/utils/motionVariants.ts';
import { useDonations } from '../hooks/useDonations.ts';
import { toast } from 'sonner';
import DonationBox from '../components/DonationBox';
import DonorList from '../components/DonorList';
import UpiQRCode from '../components/UpiQRCode';
import { getUserProfile } from '@/shared/utils/helper';
import { Text, Title } from '@/shared/components/ui/typography';

// Component
const Donations: React.FC = () => {
    // Admin image
    const razenImg = '/razenImg.webp';

    const [amount, setAmount] = useState<number | null>(null); // the amount being donated
    const [message, setMessage] = useState<string>(''); // the optional message
    const [anonymous, setAnonymous] = useState<boolean>(false); // if the user wishes to donate anonymously
    const [utr, setUtr] = useState<string>(''); // Compulsory UTR number
    const [step, setStep] = useState<'form' | 'generateQR' | 'utr' | 'thankYou'>('form'); // sep at which we are present in the process

    const [showQR, setShowQR] = useState<boolean>(false);

    // Getting the user profile from localStorage and setting the userId otherwise null
    const userProfile = getUserProfile();
    const userId = userProfile ? (userProfile.id != '1' ? userProfile.id : null) : null;

    // Using useDonations hook to get the donations array, loading status, addDonation function and loadDonations function
    const { donations, loading, addDonation, loadDonations } = useDonations();

    // The donations are loaded on the first render
    useEffect(() => {
        loadDonations();
    }, [loadDonations]);

    const handleUTRSubmit = async () => {
        if (!utr) return toast.warning('Enter UTR number');
        try {
            await addDonation({ userId, amount: amount!, message, anonymous, utr });
            setStep('thankYou');
            setMessage('');
            setAnonymous(false);
            setAmount(null);
            setUtr('');
            toast.success('Thank you for donating ❤️');
        } catch (err) {
            console.error('error submitting donation: ', err);
            toast.error('Error submitting donation');
        }
    };

    // Top donator
    const maxAmount = Math.max(...donations.map((d) => d.actual_amount));
    const topDonor = donations.filter((d) => d.actual_amount === maxAmount);

    return (
        <div className="min-h-screen overflow-auto p-4 pb-40 text-gray-900 dark:text-gray-200">
            {/* Profile Card */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="relative mb-8 flex flex-col items-center overflow-hidden rounded-3xl border border-white/20 bg-white/20 p-5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06]"
            >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5" />

                <img
                    src={razenImg}
                    alt="Razen"
                    className="relative mb-3 h-24 w-24 rounded-full border border-white/30 object-cover shadow-lg sm:h-28 sm:w-28"
                />

                <Title className="relative mb-1 bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-3xl font-extrabold text-transparent tracking-wide">
                    Razen
                </Title>

                <Text className="relative max-w-md text-center text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                    Thank you so much for thinking of supporting me, it means a lot to me!
                </Text>
            </motion.div>

            {/* Main Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row"
            >
                {/* Left: Donation Form */}
                <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/20 bg-white/20 p-4 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06] sm:p-5">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent dark:from-white/5" />

                    <div className="relative">
                        {step === 'form' && (
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
                        )}

                        {step === 'utr' && showQR && (
                            <div className="space-y-4 text-center">
                                <UpiQRCode amount={amount} />

                                <p className="text-sm text-muted-foreground">
                                    After completing the payment, enter your Transaction ID below.
                                </p>

                                <img
                                    src="/tidscreenshot.jpeg"
                                    alt="UTR Guide"
                                    className="mx-auto w-full max-w-xs rounded-xl border border-white/20"
                                />

                                <input
                                    type="text"
                                    placeholder="Enter UTR number"
                                    value={utr}
                                    onChange={(e) => setUtr(e.target.value)}
                                    className="w-full rounded-xl border border-white/20 bg-white/20 p-3 text-sm backdrop-blur-xl outline-none transition focus:ring-2 focus:ring-blue-400 dark:bg-white/[0.05]"
                                />

                                <button
                                    onClick={handleUTRSubmit}
                                    className="w-full rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
                                >
                                    Payment Done
                                </button>
                            </div>
                        )}

                        {step === 'thankYou' && (
                            <div className="space-y-4 text-center">
                                <h3 className="text-2xl font-bold">Thank you for your support!</h3>

                                <p className="text-sm text-muted-foreground">
                                    Your payment will be verified within 24 hours and updated on the
                                    donor list.
                                </p>

                                <button
                                    onClick={() => setStep('form')}
                                    className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
                                >
                                    Donate Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Donor List */}
                <div className="flex-1">
                    {donations.length > 0 && !loading ? (
                        <>
                            <h3 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
                                🌟 Supporters
                            </h3>

                            {topDonor.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="mb-2 text-lg font-semibold">Top Donor</h3>

                                    <DonorList donations={topDonor} />
                                </div>
                            )}

                            <h3 className="mb-2 text-lg font-semibold">All Donors</h3>

                            <DonorList donations={donations} />
                        </>
                    ) : (
                        <div className="rounded-2xl border border-white/20 bg-white/20 p-6 text-center text-sm italic text-muted-foreground backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
                            No supporters yet — be the first to donate! 💫
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Donations;
