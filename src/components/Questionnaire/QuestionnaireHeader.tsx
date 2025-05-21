import React from 'react';
import { Brain, Save, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuestionnaireHeaderProps {
  progress: number;
}

const QuestionnaireHeader: React.FC<QuestionnaireHeaderProps> = ({ progress }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Brain className="text-primary-600 h-6 w-6 mr-2" />
              <span className="text-lg font-display font-bold text-neutral-800">Brandician.AI</span>
            </Link>
            
            <div className="hidden md:flex ml-12 space-x-1">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 0 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Discovery
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 40 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Analysis
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 60 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Strategy
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 80 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Identity
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 100 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Review
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="hidden md:flex items-center text-neutral-600 hover:text-primary-600 transition-colors">
              <Save className="h-5 w-5 mr-1" />
              <span>Save Progress</span>
            </button>
            
            <button className="md:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuestionnaireHeader;