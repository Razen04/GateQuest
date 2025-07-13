import React, { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const ContactField = ({ label, type, name, placeholder, formData, handleInputChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
                type={type}
                name={name}
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder={placeholder}
                className="w-full p-3 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
        </div>
    )
}

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    })

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

    return (
        <div className="p-8 bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark min-h-screen">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold">Get in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Touch</span></h1>
                <p className="mt-2">Have questions or need assistance? We're here to help.</p>
            </motion.div>

            <div>
                {/* Contact Form */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="lg:col-span-2"
                >
                    <motion.div
                        variants={itemVariants}
                        className="p-8 rounded-xl shadow-sm border border-border-primary dark:border-border-primary-dark"
                    >
                        <h2 className="text-xl font-semibold mb-6">Send us a message</h2>

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
                                    <ContactField label="Your Name" type="text" name="name" placeholder="Enter your name" formData={formData} handleInputChange={handleInputChange} />
                                    <ContactField label="Email Address" type="email" name="email" placeholder="Enter your email" formData={formData} handleInputChange={handleInputChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subject</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-border-primary dark:border-border-primary-dark rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Account Issues">Account Issues</option>
                                        <option value="Feedback">Feedback</option>
                                        <option value="Partnership">Partnership</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                        rows="5"
                                        placeholder="How can we help you?"
                                            className="w-full p-3 border border-border-primary dark:border-border-primary-dark  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    ></textarea>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full text-white py-3 rounded-lg font-medium transition-all ${loading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer'
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
                            <button className="px-6 py-3 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer">
                                Join Discord Community
                            </button>
                            <button className="px-6 py-3 bg-white/20 text-white backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white/30 transition-colors cursor-pointer">
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