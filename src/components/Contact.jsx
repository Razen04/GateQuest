import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    FaEnvelope, FaPhoneAlt, FaMapMarkerAlt,
    FaChevronDown, FaChevronUp, FaTwitter,
    FaFacebook, FaLinkedin, FaInstagram, FaDiscord
} from 'react-icons/fa'
import axios from 'axios'

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    })

    const [activeAccordion, setActiveAccordion] = useState('general')
    const [messageSent, setMessageSent] = useState(false)
    const [loading, setLoading] = useState(false)

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/contact', formData);
            setMessageSent(true);
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Failed to send message");
        } finally {
            setLoading(false)
        }
    };

    // Toggle FAQ accordion
    const toggleAccordion = (id) => {
        setActiveAccordion(activeAccordion === id ? null : id)
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    }

    // FAQ data
    const faqs = [
        {
            id: 'general',
            question: 'What is GATE Prep?',
            answer: 'GATE Prep is a comprehensive platform designed to help students prepare for the Graduate Aptitude Test in Engineering (GATE) exam, specifically for Computer Science and Information Technology.'
        },
        {
            id: 'content',
            question: 'What study materials are available?',
            answer: 'Our platform offers a wide range of study materials including practice questions, video lectures, notes, previous year papers, mock tests, and personalized study plans tailored to your progress.'
        },
        {
            id: 'subscription',
            question: 'Is there a premium subscription?',
            answer: 'Yes, we offer both free and premium subscription plans. The premium plan unlocks additional practice questions, full-length mock tests, personalized analytics, and priority support.'
        },
        {
            id: 'support',
            question: 'How can I get help with a specific topic?',
            answer: 'You can use our discussion forum to ask specific questions, schedule a one-on-one session with our experts, or browse our extensive FAQ and knowledge base for immediate answers.'
        }
    ]

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-gray-800">Get in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Touch</span></h1>
                <p className="text-gray-600 mt-2">Have questions or need assistance? We're here to help.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Form */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="lg:col-span-2"
                >
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Send us a message</h2>

                        {messageSent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6"
                            >
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                    </svg>
                                    Thank you for your message! We'll get back to you shortly.
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter your name"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter your email"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Account Issues">Account Issues</option>
                                        <option value="Feedback">Feedback</option>
                                        <option value="Partnership">Partnership</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows="5"
                                        placeholder="How can we help you?"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    ></textarea>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full py-3 rounded-lg text-white font-medium transition-all ${loading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                                            }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </motion.div>

                {/* Contact Information */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Contact Information</h2>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-3">
                                    <FaEnvelope className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <a href="mailto:support@gateprep.com" className="text-gray-800 hover:text-blue-600 transition-colors">support@gateprep.com</a>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-3">
                                    <FaPhoneAlt className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <a href="tel:+918005556789" className="text-gray-800 hover:text-blue-600 transition-colors">+91 800 555 6789</a>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white mr-3">
                                    <FaMapMarkerAlt className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="text-gray-800">Bengaluru, Karnataka, India</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-gray-600 mb-3">Connect with us</p>
                            <div className="flex space-x-3">
                                <a href="#" className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                    <FaTwitter className="h-5 w-5" />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                    <FaFacebook className="h-5 w-5" />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                    <FaLinkedin className="h-5 w-5" />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                    <FaInstagram className="h-5 w-5" />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                                    <FaDiscord className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>

                        <div className="space-y-3">
                            {faqs.map(faq => (
                                <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        className="w-full px-4 py-3 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleAccordion(faq.id)}
                                    >
                                        <span className="font-medium text-gray-800">{faq.question}</span>
                                        {activeAccordion === faq.id ?
                                            <FaChevronUp className="text-gray-500" /> :
                                            <FaChevronDown className="text-gray-500" />
                                        }
                                    </button>

                                    {activeAccordion === faq.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="px-4 py-3 bg-gray-50 border-t border-gray-200"
                                        >
                                            <p className="text-gray-600">{faq.answer}</p>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-10"
            >
                <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-3">Join our Community</h2>
                        <p className="mb-6 opacity-90">Connect with fellow GATE aspirants, share resources, and get your questions answered</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button className="px-6 py-3 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                                Join Discord Community
                            </button>
                            <button className="px-6 py-3 bg-white/20 text-white backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                                Follow on Social Media
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Contact