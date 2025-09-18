import React from 'react';
import {Link} from 'react-router-dom';
import {Brain} from "lucide-react";

const Footer: React.FC = () => (
    <footer className="bg-secondary-700 text-white py-16">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Brand Section */}
                <div>
                    <div className="flex items-center mb-4">
                        <Brain className="h-8 w-8 mr-3"/>
                        <h3 className="text-xl font-display font-bold">Brandician.AI</h3>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Nurturing brands into legends since 2010</h4>
                    <p className="text-sm leading-relaxed opacity-90">
                        Hearts seek connection—<br/>
                        Archetypes light hidden paths<br/>
                        to brands they cherish
                    </p>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <a href="mailto:info@brandician.ai"
                               className="hover:text-primary-300 transition-colors">
                                info@brandician.ai
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">About</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-primary-300 transition-colors">About
                            Brandician</a></li>
                        <li><a href="#" className="hover:text-primary-300 transition-colors">What makes us
                            special</a></li>
                        <li><a href="#" className="hover:text-primary-300 transition-colors">The App</a></li>
                        <li><a href="#" className="hover:text-primary-300 transition-colors">Our work</a></li>
                    </ul>

                    <h4 className="text-lg font-semibold mt-6 mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-primary-300 transition-colors">Privacy Policy</a>
                        </li>
                        <li><a href="#" className="hover:text-primary-300 transition-colors">Terms of Use</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/20 pt-8">
                <p className="text-sm opacity-75">
                    © 2010–{new Date().getFullYear()} LAJT d.o.o. Ljubljana, Slovenia. All Rights reserved.
                </p>
            </div>
        </div>
    </footer>

);

export default Footer; 