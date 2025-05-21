import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <header className="flex justify-between items-center mb-8 md:mb-16">
          <div className="flex items-center">
            <Brain className="text-primary-600 h-7 w-7 md:h-8 md:w-8 mr-2" />
            <h1 className="text-xl md:text-2xl font-display font-bold text-neutral-800">Brandician.AI</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-neutral-600 hover:text-primary-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-neutral-600 hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#pricing" className="text-neutral-600 hover:text-primary-600 transition-colors">Pricing</a>
          </nav>
          <Link 
            to="/register"
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Get Started
          </Link>
        </header>

        <main>
          <motion.section 
            className="flex flex-col md:flex-row items-center mb-16 md:mb-24"
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            <motion.div className="md:w-1/2 mb-8 md:mb-0" {...fadeIn}>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-800 mb-6">
                Create Your Brand Identity with AI
                <Sparkles className="inline text-secondary-500 h-6 w-6 md:h-8 md:w-8 ml-2" />
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 mb-8">
                Transform your business idea into a complete brand identity in minutes, not months. 
                Our AI-powered platform guides you through a strategic branding process that would 
                normally cost thousands.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link 
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center"
                >
                  Start Your Brand Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a 
                  href="#how-it-works" 
                  className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium py-3 px-6 rounded-md transition-colors text-center"
                >
                  See How It Works
                </a>
              </div>
            </motion.div>

            <motion.div 
              className="md:w-1/2 flex justify-center"
              variants={fadeIn}
            >
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <div className="bg-neutral-50 p-4 rounded-md mb-4">
                  <div className="h-8 bg-primary-100 rounded-md w-3/4 mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded-md w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded-md w-5/6"></div>
                </div>
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center">
                    <Sparkles className="text-secondary-500 h-6 w-6" />
                  </div>
                  <div className="ml-3">
                    <div className="h-4 bg-neutral-200 rounded-md w-40 mb-2"></div>
                    <div className="h-3 bg-neutral-100 rounded-md w-24"></div>
                  </div>
                </div>
                <div className="h-10 bg-primary-500 rounded-md w-full"></div>
              </div>
            </motion.div>
          </motion.section>

          <motion.section 
            id="features" 
            className="mb-16 md:mb-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-display font-bold text-neutral-800 text-center mb-12">
              Complete Brand Creation in Minutes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <Brain className="text-primary-600 h-6 w-6" />
                </div>
                <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">AI-Powered Insights</h3>
                <p className="text-neutral-600">
                  Our AI analyzes your business goals and target audience to generate strategic insights that inform every aspect of your brand.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-secondary-500 h-6 w-6" />
                </div>
                <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">Complete Brand Package</h3>
                <p className="text-neutral-600">
                  Get everything you need: brand name options, visual identity recommendations, messaging, and positioning strategy.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600 h-6 w-6" />
                </div>
                <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">Easy Implementation</h3>
                <p className="text-neutral-600">
                  Download your complete brand package with all assets and guidelines to bring your brand to life immediately.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section 
            id="how-it-works" 
            className="mb-16 md:mb-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-display font-bold text-neutral-800 text-center mb-12">
              Your Brand Development Journey
            </h2>

            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 transform -translate-x-1/2"></div>
              
              <div className="space-y-12 md:space-y-24 relative">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">1. Discovery Questionnaire</h3>
                    <p className="text-neutral-600">
                      Answer simple questions about your business, goals, and target audience. Our AI analyzes your responses to understand your needs.
                    </p>
                  </div>
                  <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10 bg-white rounded-full h-12 w-12 flex items-center justify-center border-2 border-primary-500 text-primary-600 font-bold">
                    1
                  </div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-neutral-100 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right order-1 md:order-1">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-neutral-100 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                  <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10 bg-white rounded-full h-12 w-12 flex items-center justify-center border-2 border-primary-500 text-primary-600 font-bold order-2 md:order-2">
                    2
                  </div>
                  <div className="md:w-1/2 md:pl-12 order-3 md:order-3">
                    <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">2. Strategic Profile</h3>
                    <p className="text-neutral-600">
                      Receive a detailed brand strategy document with market analysis, positioning recommendations, and brand personality traits.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right">
                    <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">3. Brand Identity Creation</h3>
                    <p className="text-neutral-600">
                      Our AI generates name options, visual style recommendations, and messaging frameworks tailored to your strategic profile.
                    </p>
                  </div>
                  <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10 bg-white rounded-full h-12 w-12 flex items-center justify-center border-2 border-primary-500 text-primary-600 font-bold">
                    3
                  </div>
                  <div className="md:w-1/2 md:pl-12">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-neutral-100 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 mb-6 md:mb-0 md:pr-12 md:text-right order-1 md:order-1">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-neutral-100 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
                    </div>
                  </div>
                  <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2 z-10 bg-white rounded-full h-12 w-12 flex items-center justify-center border-2 border-primary-500 text-primary-600 font-bold order-2 md:order-2">
                    4
                  </div>
                  <div className="md:w-1/2 md:pl-12 order-3 md:order-3">
                    <h3 className="text-xl font-display font-bold text-neutral-800 mb-2">4. Finalization & Delivery</h3>
                    <p className="text-neutral-600">
                      Review and refine your brand assets, then download your complete brand package with all the elements you need.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section 
            id="pricing" 
            className="mb-16 md:mb-24"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-display font-bold text-neutral-800 text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
              Pay what you want! After we generate the branding assets and you actually see them - enter ANY amount based on the perceived value of what we delivered. And yes, if right now things are tight - you can also enter ZERO as the amount and you will get it for FREE.
            </p>

            <div className="bg-primary-50 p-8 md:p-12 rounded-xl max-w-4xl mx-auto text-center">
              <h3 className="text-2xl font-display font-bold text-neutral-800 mb-6">
                Value-Based Pricing
              </h3>
              <p className="text-lg text-neutral-600 mb-8">
                We believe in the value of our service so much that we let you decide what it's worth to you after seeing the results.
              </p>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
                <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-primary-600 font-bold text-xl">$0</span>
                  <span className="text-neutral-500">Free option</span>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center border-2 border-primary-400">
                  <span className="text-primary-600 font-bold text-xl">$149</span>
                  <span className="text-neutral-500">Suggested value</span>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col items-center">
                  <span className="text-primary-600 font-bold text-xl">$299+</span>
                  <span className="text-neutral-500">Premium support</span>
                </div>
              </div>
              <Link
                to="/register"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-md transition-colors"
              >
                Start Your Brand Journey Today
              </Link>
            </div>
          </motion.section>

          <motion.section 
            className="mb-16 md:mb-24 bg-primary-50 p-8 md:p-12 rounded-xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-display font-bold text-neutral-800 mb-6">
                Ready to Transform Your Business with a Powerful Brand?
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Join thousands of entrepreneurs who have used Brandician.AI to create memorable, 
                effective brands that resonate with their audience.
              </p>
              <Link
                to="/register"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-md transition-colors"
              >
                Start Your Brand Journey Today
              </Link>
            </div>
          </motion.section>
        </main>

        <footer className="border-t border-neutral-200 pt-8 pb-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Brain className="text-primary-600 h-6 w-6 mr-2" />
              <span className="text-lg font-display font-bold text-neutral-800">Brandician.AI</span>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors text-center md:text-left">Privacy Policy</a>
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors text-center md:text-left">Terms of Service</a>
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors text-center md:text-left">Contact Us</a>
            </div>
            <div className="mt-6 md:mt-0 text-neutral-500 text-sm">
              &copy; {new Date().getFullYear()} Brandician.AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;