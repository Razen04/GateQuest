const instructions = [
    {
        text: 'Before you donate:',
        sub: [
            {
                text: 'Donations are voluntary and non-refundable. No goods or services are exchanged in return and only perks are given.',
            },
            {
                text: 'By proceeding, you agree to our Terms of Service.',
            },
            {
                text: 'UPI payments are handled entirely by your bank. We never see or store your card, bank account, or UPI PIN. We can see the UPI registered name though.',
            },
        ],
    },
    {
        text: 'Choose your donation:',
        sub: [
            {
                text: 'Pick ₹50, ₹169, or ₹569 or enter a custom amount of ₹50 or above.',
            },
            {
                text: 'Your donor tier (Bronze / Gold / Platinum) is based on the amount actually received.',
            },
            {
                text: 'Toggle anonymous to hide your name from the public patron ledger.',
            },
            {
                text: 'Optional message (up to 100 characters) is shown publicly with your donation. Please be respectful.',
            },
        ],
    },
    {
        text: 'Click "Generate Dynamic QR Code" to see the payment QR.',
    },
    {
        text: 'Pay using any UPI app (GPay, PhonePe, Paytm, or your bank app). On a single device, screenshot the QR and use "Scan from gallery" in your UPI app. UPI works only within India so donations from outside India are not currently supported.',
    },
    {
        text: 'Pay the exact amount you selected. If you pay a different amount, we honour the amount actually received but this affects which tier you reach.',
    },
    {
        text: 'Copy the 12-digit UTR / reference number from your UPI app receipt. The guide image below the input shows exactly where to find it. This is very important do not mess this up to prevent wasting both of our time.',
    },
    {
        text: 'Paste the UTR and click "Submit Transaction for Verification". Each UTR can only be submitted once and a wrong UTR cannot be corrected and will require manual review.',
    },
    {
        text: 'Most donations verify automatically within a few minutes, once the bank sends its confirmation email. If the email is delayed, verification waits for it — no action is needed from you.',
    },
    {
        text: 'Once verified, your donation appears in the patron ledger (anonymously if selected) and any unlocked supporter perks activate on your profile.',
    },
    {
        text: 'If your donation is still unverified after 24 hours, message me on Discord or email with your UTR and I will resolve it manually.',
    },
    {
        text: 'IMPORTANT: Since this is a custom infrastructure, do not expect perks in a second, wait for at most 30 mins before contacting me.',
    },
];

export default instructions;
