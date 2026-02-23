import React from "react";
import Button from "./Button";

interface SkipSurveyWarningProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SkipSurveyWarning: React.FC<SkipSurveyWarningProps> = ({
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold text-neutral-800 mb-3">
        Skip survey?
      </h3>
      <p className="text-neutral-600 text-sm mb-5">
        By skipping the survey you miss the opportunity to validate your brand
        hypothesis with real customer feedback. The insights from even a small
        number of responses can significantly strengthen your brand strategy.
      </p>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary" size="md">
          Go back
        </Button>
        <Button onClick={onConfirm} size="md">
          Yes, skip the survey
        </Button>
      </div>
    </div>
  </div>
);

export default SkipSurveyWarning;
