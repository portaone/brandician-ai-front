import { Save } from "lucide-react";
import React from "react";
import GetHelpButton from "../common/GetHelpButton";
import HistoryButton from "../common/HistoryButton";

interface QuestionnaireHeaderProps {
  progress: number;
  onSaveExit?: () => void;
  brandId?: string;
}

const QuestionnaireHeader: React.FC<QuestionnaireHeaderProps> = ({
  onSaveExit,
  brandId,
}) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto sm:p-4 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-grow flex-wrap">
            {brandId && <HistoryButton brandId={brandId} size="sm" />}
            <GetHelpButton variant="secondary" size="sm" />
          </div>
          <div className="flex items-end space-x-4 flex-col">
            <button
              className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
              onClick={onSaveExit}
            >
              <Save className="h-5 w-5 mr-1" />
              <span>Exit</span>
            </button>
            <span className="text-xs text-neutral-500 mt-1 text-center hidden md:block">
              All the progress you made so far will be saved
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuestionnaireHeader;
