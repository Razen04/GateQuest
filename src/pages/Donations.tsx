import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { containerVariants } from '../utils/motionVariants.ts';
import { useDonations } from '../hooks/useDonations.ts';
import { toast } from 'sonner';
import DonationBox from '../components/Donation/DonationBox.tsx';
import DonorList from '../components/Donation/DonorList.tsx';
import UpiQRCode from '../components/Donation/UpiQRCode.tsx';
import { getUserProfile } from '../helper.ts';
import { Text, Title } from '@/components/ui/typography.tsx';

// Component
const Donations: React.FC = () => {
    // Admin image
    const razenImg = '/razenImg.jpeg';

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
        <div className="p-6 pb-40 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-200 max-h-screen overflow-auto">
            {/* Profile Card */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center mb-8 bg-gradient-to-tr from-blue-50 to-white dark:from-zinc-800 dark:to-zinc-900
                         p-4 sm:p-6 md:p-8 shadow-lg transition-all duration-300"
            >
                <img
                    src={razenImg}
                    alt="Razen"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-3 sm:mb-4 shadow-md rounded-full"
                />
                <Title className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-purple-500 mb-1 sm:mb-2 tracking-wide">
                    Razen
                </Title>
                <Text className="text-center text-gray-700 dark:text-gray-400 text-sm sm:text-base md:text-lg max-w-sm sm:max-w-md">
                    Thank you so much for thinking of supporting me, it means a lot to me!
                </Text>
            </motion.div>

            {/* Main Content */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto"
            >
                {/* Left: Donation Form */}
                <div className="flex-1 bg-white dark:bg-zinc-800 shadow-xl p-6 sm:p-8 space-y-6 h-fit">
                    {/* Form Step */}
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

                    {/* UTR Step */}
                    {step === 'utr' && showQR && (
                        <div className="space-y-4 text-center w-full">
                            <UpiQRCode amount={amount} />

                            <p>
                                After completing the payment, enter your Transaction ID below, the
                                screenshot below will help you:
                            </p>
                            <img
                                src="/tidscreenshot.jpeg"
                                alt="UTR Guide"
                                className="w-full max-w-xs mx-auto"
                            />
                            <input
                                type="text"
                                placeholder="Enter UTR number"
                                value={utr}
                                onChange={(e) => setUtr(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                                onClick={handleUTRSubmit}
                                // REFINED: Added accessibility focus-visible ring
                                className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                            >
                                Payment Done
                            </button>
                        </div>
                    )}

                    {/* Thank You Step */}
                    {step === 'thankYou' && (
                        <div className="text-center space-y-4 max-h-fit">
                            <h3 className="text-2xl font-bold">Thank you for your support!</h3>
                            <p>
                                Your payment will be verified within 24 hours and updated on the
                                donor list.
                            </p>
                            <button
                                onClick={() => setStep('form')}
                                // REFINED: Added accessibility focus-visible ring
                                className="py-2 px-6 bg-blue-500 text-white hover:bg-blue-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            >
                                Donate Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Donor List */}
                <div className="flex-1">
                    {donations.length > 0 && !loading ? (
                        <>
                            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
                                🌟 Supporters
                            </h3>
                            {/* Top donor */}
                            {topDonor && topDonor.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold mb-2">Top Donor</h3>
                                    <DonorList donations={topDonor} />
                                </div>
                            )}

                            {/* All donors */}
                            <h3 className="text-lg font-bold mb-2">All Donors</h3>
                            <DonorList donations={donations} />
                        </>
                    ) : (
                        <div className="bg-white dark:bg-zinc-800 shadow-md p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400 italic">
                            No supporters yet — be the first to donate! 💫
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Donations;
