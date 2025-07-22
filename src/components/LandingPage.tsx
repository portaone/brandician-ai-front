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
                normally cost thousands of dollars with a marketing agency. Moreover, we do not just
                generate something that seems ok (you can do it for free using ChatGPT!). Our process
                involves validation of the brand hypothesis with realm people from the target audience,
                so if there is a need to adjust the brand - you will do it immediately and not after
                failure of the first version of the product (wasting quite a bit of time and money).
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
            <p className="text-lg text-neutral-600 mb-8">
                We believe in the value of our service so much that we let you decide what it's worth to you
                after seeing the final results (chosen archetype, tone of voice, brand assets, etc.) - and 
                set <strong>your own price!</strong>.
              </p>
              <p className="text-lg text-neutral-600 mb-8">And yes, it means you can pay <strong>ZERO </strong> 
                 if the cash situation is tight at the moment!
              </p>


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