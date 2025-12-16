import type { Faq } from '../types/Faq.ts';

export const faqs: Faq[] = [
    // --- The Basics: What is this and what does it cost? ---
    {
        question: 'What is GATEQuest?',
        answer: [
            {
                type: 'text',
                content:
                    'GATEQuest is a free, open-source platform designed to help students prepare for the GATE (Graduate Aptitude Test in Engineering) exam. My goal is to provide high-quality PYQs in a modern, user-friendly interface.',
            },
        ],
    },
    {
        question: 'Is the platform completely free?',
        answer: [
            {
                type: 'text',
                content:
                    'Yes, GATEQuest is and always will be free to use, provided as long as I can keep it free.',
            },
        ],
    },
    {
        question: 'Will you put Ads?',
        answer: [
            {
                type: 'text',
                content:
                    'Nope, that will defeat the purpose of being distraction-free. If money ever becomes a problem, I will ask for donations upfront or close the project.',
            },
        ],
    },
    {
        question: 'Is there an Android app or an iOS app?',
        answer: [
            {
                type: 'text',
                content:
                    "No there isn't any as of now, in future maybe if someone wishes to make can contact me on Discord but there is PWA and here is the link how to use it ",
            },
            {
                type: 'link',
                text: 'PWA',
                href: 'https://www.youtube.com/watch?v=iJteraObjgs',
            },
        ],
    },

    // --- Content: What's on the platform? ---
    {
        question: 'What is the source of questions?',
        answer: [
            { type: 'text', content: 'The source for questions is the ' },
            {
                type: 'link',
                text: 'GOPDF PYQs repository',
                href: 'https://github.com/GATEOverflow/GO-PDFs',
            },
            { type: 'text', content: '.' },
        ],
    },
    {
        question: 'Are all questions present in the app?',
        answer: [
            {
                type: 'text',
                content:
                    'Except for descriptive and out-of-syllabus questions, all are present in the app (only for CS branch as of now). I may add descriptive questions in the future.',
            },
        ],
    },
    {
        question: 'What if I find an error in a question?',
        answer: [
            {
                type: 'text',
                content:
                    'Most probably you will because everything is done manually so would like you to let me know about it via reporting question through the app itself.',
            },
        ],
    },

    // --- Community: How can I get involved? ---
    {
        question: 'How can I contribute to the project?',
        answer: [
            {
                type: 'text',
                content:
                    'I welcome all contributions! Whether you are a developer or a designer, the best place to start is our ',
            },
            {
                type: 'link',
                text: 'GitHub repository',
                href: 'https://github.com/Razen04/GateQuest',
            },
            { type: 'text', content: '. You can also join our ' },
            {
                type: 'link',
                text: 'Discord',
                href: 'https://discord.gg/dFmg3g52c5',
            },
            { type: 'text', content: ' to discuss ideas.' },
        ],
    },
    {
        question: 'How can I report a bug or request a feature?',
        answer: [
            {
                type: 'text',
                content:
                    'The best way to report a bug or suggest a new feature is by opening an issue on our ',
            },
            {
                type: 'link',
                text: 'GitHub repository',
                href: 'https://github.com/Razen04/GateQuest/issues',
            },
            {
                type: 'text',
                content: '. This helps us track all feedback in one place. You can also join our ',
            },
            {
                type: 'link',
                text: 'Discord server',
                href: 'https://discord.gg/dFmg3g52c5',
            },
            { type: 'text', content: ' and report the issue directly.' },
        ],
    },

    // --- Policies: Important details about usage ---
    {
        question: 'What about privacy?',
        answer: [
            {
                type: 'text',
                content:
                    "I take privacy seriously that is why you can use the platform without signing up but analytics require sign-in therefore that is something I can't avoid but rest assured I have taken very little information about you and that is your email id which cannot be changed but other things like name, institution can be changed so you don't necessarily have to use your real details.",
            },
        ],
    },
];
