import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Never change this only the lead developer touches this
const upiId = 'razen@upi';

type UpiQRCodeProps = {
    amount: number | null;
};

const UpiQRCode: React.FC<UpiQRCodeProps> = ({ amount }) => {
    const params = new URLSearchParams({
        pa: upiId,
        cu: 'INR',
    });

    if (amount != null) {
        params.set('am', amount.toFixed(2));
    }

    const upiUrl = `upi://pay?${params.toString()}`;

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
                marginSize={2}
                imageSettings={{
                    src: '/icons/logo.png',
                    height: 40,
                    width: 40,
                    excavate: true,
                }}
            />
        </div>
    );
};

export default UpiQRCode;
