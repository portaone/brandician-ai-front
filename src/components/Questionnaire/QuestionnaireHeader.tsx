import React from 'react';
import { Brain, Save, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import GetHelpButton from '../common/GetHelpButton';
import HistoryButton from '../common/HistoryButton';

interface QuestionnaireHeaderProps {
  progress: number;
  onSaveExit?: () => void;
  brandId?: string;
}

const QuestionnaireHeader: React.FC<QuestionnaireHeaderProps> = ({ progress, onSaveExit, brandId }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="hidden md:flex ml-12 space-x-1">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 0 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Discovery
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 40 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Analysis
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 60 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Survey
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 80 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Assets
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${progress >= 100 ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                Review
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {brandId && <HistoryButton brandId={brandId} variant="outline" size="sm" />}
            <GetHelpButton variant="secondary" size="sm" />
            <div className="flex items-center space-x-4 flex-col items-end">
              <button className="hidden md:flex items-center text-neutral-600 hover:text-primary-600 transition-colors" onClick={onSaveExit}>
                <Save className="h-5 w-5 mr-1" />
                <span>Exit</span>
              </button>
              <span className="text-xs text-neutral-500 mt-1 hidden md:block">All the progress you made so far will be saved</span>
              <button className="md:hidden p-2 text-neutral-600 hover:text-primary-600 transition-colors">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuestionnaireHeader;