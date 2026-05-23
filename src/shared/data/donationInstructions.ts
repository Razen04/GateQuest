const instructions = [
    {
        text: 'Fill the donation form:',
        sub: [
            {
                text: 'Toggle "Remain Anonymous" if you want to hide your name.',
            },
            {
                text: 'Write an optional message (max 100 characters).',
            },
            {
                text: 'Select a suggested amount: ₹20 | ₹69 | ₹169, or enter a custom amount.',
            },
        ],
    },
    {
        text: 'Click "Generate QR + Link" to get your payment details.',
    },
    {
        text: 'You will need 2 devices, one for scanning the QR code.',
    },
    {
        text: 'After completing the payment, enter the reference number exactly as shown in your payment confirmation. The screenshot will guide you on how to find the reference number.',
    },
    {
        text: 'Click "Payment Done" to submit your donation.',
    },
    {
        text: 'Your donation will be verified within 24 hours and updated in the Supporter List.',
    },
    {
        text: 'You can see your contribution on the right side donor list. (Anonymous donors will appear as "Anonymous" name)',
    },
];

export default instructions;
