import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';
import { brands } from '../../lib/api';
import { useBrandStore } from '../../store/brand';
import { navigateAfterProgress } from '../../lib/navigation';

interface BrandAsset {
  type: string;
  description?: string;
  url?: string | null;
  content?: string | null;
  created_at?: string | null;
}

interface BrandAssetsResponse {
  id: string;
  brand_id: string;
  assets: BrandAsset[];
}

interface BrandAssetsProps {
  brandId: string;
}

const BrandAssets: React.FC<BrandAssetsProps> = ({ brandId }) => {
  const navigate = useNavigate();
  const { progressBrandStatus } = useBrandStore();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProgressing, setIsProgressing] = useState(false);
  
  // Add refs to prevent duplicate calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAssets = async () => {
      // Prevent duplicate calls
      if (isLoadingRef.current || hasLoadedRef.current) {
        console.log('⏸️ Skipping duplicate assets fetch');
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Fetching brand assets for:', brandId);
        const response: BrandAssetsResponse = await brands.produceAssets(brandId);
        
        if (isMounted) {
          setAssets(response.assets);
          if (response.assets.length > 0) {
            setActiveTab(response.assets[0].type);
          }
          hasLoadedRef.current = true;
        }
      } catch (e) {
        if (isMounted) {
          console.error('❌ Failed to load brand assets:', e);
          setError('Failed to load brand assets.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isLoadingRef.current = false;
      }
    };

    // Small delay to help prevent React StrictMode duplicates
    const timeoutId = setTimeout(fetchAssets, 50);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      isLoadingRef.current = false;
    };
  }, [brandId]);

  const assetTypes = useMemo(() => 
    Array.from(new Set(assets.map(a => a.type))), 
    [assets]
  );

  const handleProceedToPayment = async () => {
    if (!brandId || isProgressing) return;
    
    setIsProgressing(true);
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error('Failed to progress to payment:', error);
    } finally {
      setIsProgressing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Generating Brand Assets...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }
  if (assets.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">No assets found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-neutral-800 mb-6">Brand Assets</h1>
          <div className="mb-6 flex gap-2 border-b">
            {assetTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === type ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-primary-600'}`}
              >
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
          <div className="mb-8">
            {assets.filter(a => a.type === activeTab).map((asset, idx) => (
              <div key={idx} className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">{asset.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                <pre className="whitespace-pre-wrap text-gray-800 text-sm">{asset.description || asset.content || 'No description.'}</pre>
              </div>
            ))}
          </div>

          {/* Proceed to Payment Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                Love what you see? 
              </h3>
              <p className="text-neutral-600 mb-6">
                These brand assets are ready to help your business succeed. 
                Let's complete your brand journey and get these assets ready for download.
              </p>
              <button
                onClick={handleProceedToPayment}
                disabled={isProgressing}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProgressing ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Continue to Final Step
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandAssets; 