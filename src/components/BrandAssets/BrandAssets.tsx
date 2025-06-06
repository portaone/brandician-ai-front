import React, { useEffect, useState } from 'react';
import { brands } from '../../lib/api';

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
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response: BrandAssetsResponse = await brands.produceAssets(brandId);
        setAssets(response.assets);
        if (response.assets.length > 0) {
          setActiveTab(response.assets[0].type);
        }
      } catch (e) {
        setError('Failed to load brand assets.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, [brandId]);

  const assetTypes = Array.from(new Set(assets.map(a => a.type)));

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
          <div>
            {assets.filter(a => a.type === activeTab).map((asset, idx) => (
              <div key={idx} className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">{asset.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                <pre className="whitespace-pre-wrap text-gray-800 text-sm">{asset.description || asset.content || 'No description.'}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandAssets; 