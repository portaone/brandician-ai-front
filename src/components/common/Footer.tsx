import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="bg-white border-t border-neutral-200 text-center py-4 text-sm text-gray-500 w-full mt-auto">
    <Link to="/terms" className="text-primary-600 hover:underline mr-4">Terms of Service</Link>
    <Link to="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link>
  </footer>
);

export default Footer; 