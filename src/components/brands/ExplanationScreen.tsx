import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useBrandStore } from '../../store/brand';

const ExplanationScreen: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { updateBrandStatus, currentBrand, isLoading, selectBrand } = useBrandStore();

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const handleProceed = async () => {
    if (!brandId) return;
    
    try {
      await updateBrandStatus(brandId, 'questionnaire');
      navigate(`/questionnaire/${brandId}`);
    } catch (error) {
      console.error('Failed to update brand status:', error);
    }
  };

  if (isLoading || !currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Process overview</h2>
            <div className="space-y-6 text-neutral-600">
              <p>
                We will build a brand identity and brand access for your business. Your brand identity is more than just a logo or color scheme—it's your archetype, your tone of voice, your promise to customers, and your ability to meet their needs.
              </p>

              <p>
                To create something that drives your success, we need thoughtful input from you. Here's the process:
              </p>

              <div className="space-y-8 mt-8">
                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">Tell us about your business or service</h3>
                  <p>
                    Complete the questionnaire. You can record your answers using your microphone to save time. Speak plainly—like you're talking to a friend or a child. Skip the corporate buzzwords and empty marketing jargon. There are 20+ questions, so set aside 20–30 minutes to finish it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">We create your strategic profile</h3>
                  <p>
                    This is an executive summary of your business. You'll review and edit it to make sure it's accurate.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">We define profiles of your future customers</h3>
                  <p>
                    We build Jobs-to-be-Done (JTBD) personas—detailed profiles that capture different customer needs and motivations. If anything feels off, you'll have a chance to refine it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">We test your brand hypothesis</h3>
                  <p>
                    The wrong way to build a brand? Lock yourself in a garage, create a product for months, then realize no one wants it. Instead, we validate your ideas early. We design a customer questionnaire—you share it with people who might be your future customers, so they submit the real input. Believe us, many founders are surprised by the results! Based on real customer feedback, we adjust the brand vision as needed.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">Voila! We generate your brand assets</h3>
                  <p>
                    Then, we pick your archetype, tone of voice, and visual assets, ensuring AI-generated content aligns with your brand's style.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="font-bold text-neutral-800">Ready? Let's get started.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleProceed}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Proceed
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationScreen;