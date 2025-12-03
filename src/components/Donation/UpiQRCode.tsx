import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Check, Copy } from '@phosphor-icons/react';

// Never change this only the lead developer touches this
const upiId = 'razen@upi';
const name = 'Razen';

type UpiQRCodeProps = {
    amount: number | null;
};

const UpiQRCode: React.FC<UpiQRCodeProps> = ({ amount }) => {
    // Custom upiUrl
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(upiUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <h2 className="text-blue-400 text-2xl font-bold">
                Scan this QR or copy the UPI link below:
            </h2>
            <QRCodeSVG
                value={upiUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                imageSettings={{
                    src: '/logo.png',
                    height: 40,
                    width: 40,
                    excavate: true,
                }}
            />

            <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy UPI Link'}
            </button>
        </div>
    );
};

export default UpiQRCode;
