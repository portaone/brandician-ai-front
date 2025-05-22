import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBrandStore } from '../../store/brand';

const CollectFeedbackContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { updateBrandStatus } = useBrandStore();

  const handleProceed = async () => {
    if (!brandId) return;
    await updateBrandStatus(brandId, 'feedback_review');
    navigate(`/brands/${brandId}/feedback-review`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Survey Collection</h2>
        <p className="text-lg text-gray-700 mb-8">
          <span className="font-semibold text-primary-600">1001</span> people have completed your survey!
        </p>
        <button
          onClick={handleProceed}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-lg font-medium"
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default CollectFeedbackContainer; 