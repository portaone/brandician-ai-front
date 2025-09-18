import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, Link} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Brain, Sparkles, ArrowRight, CheckCircle} from 'lucide-react';
import Button from './common/Button';

const LandingPage: React.FC = () => {
    const fadeIn = {
        initial: {opacity: 0, y: 20},
        animate: {opacity: 1, y: 0},
        transition: {duration: 0.6}
    };

    return (
        <div className="min-h-screen bg-white">
            <main>
                {/* Hero Section */}
                <motion.section
                    className="relative min-h-[600px] overflow-hidden"
                    style={{
                        backgroundColor: '#7F5971',
                        backgroundImage: 'url(https://www.brandician.eu/wp-content/uploads/2021/12/seamless-back-dark-circles.svg)',
                        backgroundPosition: 'center center',
                        backgroundSize: 'cover'
                    }}
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
                    {/* Gradient overlay matching original site */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            background: 'linear-gradient(28deg, #704C63 31%, #FD615E 130%)',
                            opacity: 0.92
                        }}
                    />
                    <div className="container mx-auto flex items-center min-h-[600px]  h-[768px] relative z-10">
                        {/* Left side - Carousel */}
                        <motion.div
                            className="flex justify-center items-center max-w-[556px]"
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            transition={{duration: 0.8}}
                        >
                            <div
                                className="relative w-full overflow-hidden flex items-center justify-center">
                                {/* Hat carousel */}
                                <div className="flex space-x-8 ц">
                                    {[
                                        // Hat 1 - Classic fedora
                                        <svg key={0} width="120" height="120" viewBox="0 0 120 120"
                                             className="text-white/30 fill-current">
                                            <ellipse cx="60" cy="95" rx="55" ry="8"/>
                                            <ellipse cx="60" cy="92" rx="50" ry="6" fill="currentColor" opacity="0.4"/>
                                            <rect x="35" y="40" width="50" height="52" rx="25" fill="currentColor"
                                                  opacity="0.6"/>
                                            <ellipse cx="60" cy="40" rx="25" ry="15" fill="currentColor" opacity="0.7"/>
                                        </svg>,

                                        // Hat 2 - Bowler hat
                                        <svg key={1} width="120" height="120" viewBox="0 0 120 120"
                                             className="text-white/40 fill-current">
                                            <ellipse cx="60" cy="95" rx="45" ry="6"/>
                                            <ellipse cx="60" cy="92" rx="40" ry="5" fill="currentColor" opacity="0.5"/>
                                            <ellipse cx="60" cy="65" rx="30" ry="35" fill="currentColor" opacity="0.7"/>
                                        </svg>,

                                        // Hat 3 - Top hat
                                        <svg key={2} width="120" height="120" viewBox="0 0 120 120"
                                             className="text-white/35 fill-current">
                                            <ellipse cx="60" cy="95" rx="45" ry="6"/>
                                            <ellipse cx="60" cy="92" rx="40" ry="5" fill="currentColor" opacity="0.5"/>
                                            <rect x="40" y="20" width="40" height="72" rx="5" fill="currentColor"
                                                  opacity="0.7"/>
                                            <ellipse cx="60" cy="25" rx="20" ry="8" fill="currentColor" opacity="0.6"/>
                                        </svg>,

                                        // Hat 4 - Beret
                                        <svg key={3} width="120" height="120" viewBox="0 0 120 120"
                                             className="text-white/45 fill-current">
                                            <ellipse cx="60" cy="70" rx="45" ry="25" fill="currentColor" opacity="0.6"/>
                                            <ellipse cx="60" cy="85" rx="35" ry="8" fill="currentColor" opacity="0.7"/>
                                            <circle cx="60" cy="55" r="3" fill="currentColor" opacity="0.8"/>
                                        </svg>,

                                        // Hat 5 - Baseball cap
                                        <svg key={4} width="120" height="120" viewBox="0 0 120 120"
                                             className="text-white/50 fill-current">
                                            <ellipse cx="85" cy="95" rx="35" ry="8"/>
                                            <ellipse cx="80" cy="92" rx="30" ry="6" fill="currentColor" opacity="0.5"/>
                                            <ellipse cx="55" cy="60" rx="35" ry="25" fill="currentColor" opacity="0.7"/>
                                            <rect x="45" y="75" width="20" height="10" rx="5" fill="currentColor"
                                                  opacity="0.6"/>
                                        </svg>
                                    ].map((hat, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex-shrink-0"
                                            animate={{
                                                x: [0, -10, 0],
                                                rotate: [0, 2, 0]
                                            }}
                                            transition={{
                                                duration: 3 + i * 0.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            {hat}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right side - Content */}
                        <motion.div className="w-1/2 p-[10px] space-y-[20px]" {...fadeIn}>
                            <h1 className="hero-title">
                                Build brands on insight, not intuition.
                            </h1>
                            <p className="hero-paragraph">
                                We use psychology and AI to create brands that connect emotionally and perform
                                strategically—from startup foundations to complete transformations.
                            </p>
                            <Link
                                to="/register"
                                className="inline-block"
                            >
                                <Button
                                    size="xl"
                                    rightIcon={<svg className="w-[15px] h-[15px]" fill="currentColor"
                                                    viewBox="0 0 320 512"
                                                    xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/>
                                    </svg>}>
                                    Start reading
                                </Button>

                            </Link>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Our Mission */}
                <motion.section
                    className="bg-white py-20"
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.8}}
                >
                    <div className="container mx-auto px-4">
                        <p className="section-label">Our mission</p>
                        <h2 className="section-heading-large">
                            Make sure your brand matches what people really need.
                        </h2>
                        <p className="large-paragraph" style={{maxWidth: '800px'}}>
                            We bridge the gap between how you see your brand and how customers experience it — with
                            psychology, feedback, and a solid plan.
                        </p>
                    </div>
                </motion.section>

                {/* The Problem */}
                <motion.section
                    className="bg-neutral-800 py-20"
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.8}}
                >
                    <div className="container mx-auto px-4">
                        <p className="section-label text-white">The problem</p>
                        <h2 className="section-heading-medium white-text">
                            Brands built on guesses don't grow.
                        </h2>
                        <p className="regular-paragraph white-text" style={{maxWidth: '800px'}}>
                            When businesses skip the strategy, they end up with surface-level design driven by trends,
                            gut feelings, or a cool-looking logo — and then wonder why it doesn't connect, resonate, or
                            last.
                        </p>
                    </div>
                </motion.section>

                {/* Our Solution */}
                <motion.section
                    className="bg-white py-20"
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.8}}
                >
                    <div className="container mx-auto px-4">
                        <p className="section-label">Our Solution</p>
                        <h2 className="section-heading-medium purple-text">
                            We test before we build.
                        </h2>
                        <p className="regular-paragraph dark-text" style={{maxWidth: '800px'}}>
                            Using archetypal psychology and customer validation, we create brands that connect on a
                            fundamental level. Every decision is guided by insight, ensuring your brand resonates with
                            the people who matter most — <span className="font-semibold">your customers</span>.
                        </p>
                    </div>
                </motion.section>

                {/* Service Options */}
                <motion.section
                    className="bg-neutral-50 py-20"
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.8}}
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="section-heading-large">
                                Service Options
                            </h2>
                            <p className="large-paragraph">
                                Start smart, scale from strategic to full transformation.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Foundation Builder */}
                            <div className="bg-white p-8 rounded-lg shadow-lg">
                                <div className="mb-6">
                                    <Brain className="h-12 w-12 text-primary-500 mb-4"/>
                                    <h3 className="card-heading">
                                        Foundation Builder
                                    </h3>
                                    <p className="text-lg">
                                        <span className="text-primary-500 font-bold">Brandician.ai App - FREE</span>
                                        <br/>Strategic foundation in just 1 day
                                    </p>
                                </div>
                                <ul className="space-y-3 mb-6 text-neutral-600">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Brand strategy & archetypal profiling
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Audience validation with real customers
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Messaging framework & visual guidelines
                                    </li>
                                </ul>
                                <p className="text-sm text-neutral-600 mb-6">
                                    <strong>Best for:</strong> Early-stage startups, solopreneurs, side projects
                                </p>
                                <Link to="/register">
                                    <Button className="w-full">Start Building</Button>
                                </Link>
                            </div>

                            {/* Strategic Partnership */}
                            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-primary-500">
                                <div className="mb-6">
                                    <Sparkles className="h-12 w-12 text-primary-500 mb-4"/>
                                    <h3 className="card-heading">
                                        Strategic Partnership
                                    </h3>
                                    <p className="text-lg">
                                        <span
                                            className="text-primary-500 font-bold">App + Expert Refinement - €1,497</span>
                                        <br/>AI-powered foundation + human expertise where it matters most.
                                    </p>
                                </div>
                                <ul className="space-y-3 mb-6 text-neutral-600">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Everything in Foundation Builder
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Expert logo design & typography selection
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Visual system refinement & brand guidelines
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        <strong>Bonus:</strong> 2-hour brand workshop with our team
                                    </li>
                                </ul>
                                <p className="text-sm text-neutral-600 mb-6">
                                    <strong>Best for:</strong> Growing businesses, funded startups, rebranding projects
                                </p>
                                <Button className="w-full">Partner With Us</Button>
                            </div>

                            {/* Full Transformation */}
                            <div className="bg-white p-8 rounded-lg shadow-lg">
                                <div className="mb-6">
                                    <ArrowRight className="h-12 w-12 text-primary-500 mb-4"/>
                                    <h3 className="card-heading">
                                        Full Transformation
                                    </h3>
                                    <p className="text-lg">
                                        <span
                                            className="text-primary-500 font-bold">Complete Agency Service - €4,997+</span>
                                        <br/>End-to-end brand development with our team.
                                    </p>
                                </div>
                                <ul className="space-y-3 mb-6 text-neutral-600">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Comprehensive market research & strategy
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Complete visual identity & brand system
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        Marketing materials & brand implementation
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-primary-500 mr-2 mt-0.5"/>
                                        <strong>Bonus:</strong> 6-month brand evolution support
                                    </li>
                                </ul>
                                <p className="text-sm text-neutral-600 mb-6">
                                    <strong>Best for:</strong> Established businesses, complex rebrands, enterprise
                                    clients.
                                </p>
                                <Button className="w-full">Let's Transform</Button>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </main>
        </div>
    );
};

export default LandingPage;