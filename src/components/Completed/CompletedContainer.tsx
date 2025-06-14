import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, CheckCircle, Star, Share2, Twitter, Linkedin } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { brands } from '../../lib/api';

const CompletedContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand, selectBrand, isLoading } = useBrandStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<{[key: string]: string}>({});
  const [testimonialData, setTestimonialData] = useState<any>(null);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
    
    // Load testimonial data from localStorage if available
    if (brandId) {
      const storedTestimonial = localStorage.getItem(`testimonial_${brandId}`);
      if (storedTestimonial) {
        try {
          setTestimonialData(JSON.parse(storedTestimonial));
        } catch (error) {
          console.error('Failed to parse testimonial data:', error);
        }
      }
    }
  }, [brandId, currentBrand, selectBrand]);

  useEffect(() => {
    const loadAssets = async () => {
      if (!brandId) return;
      
      try {
        const response = await brands.produceAssets(brandId);
        setAssets(response.assets);
        
        // Generate download links for each asset
        const links: {[key: string]: string} = {};
        response.assets.forEach((asset: any, index: number) => {
          if (asset.content) {
            // Create blob URL for downloadable content
            const blob = new Blob([asset.content], { type: 'text/plain' });
            links[asset.type] = URL.createObjectURL(blob);
          }
        });
        setDownloadLinks(links);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };

    if (brandId) {
      loadAssets();
    }

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(downloadLinks).forEach(url => URL.revokeObjectURL(url));
    };
  }, [brandId]);

  const handleDownload = (assetType: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentBrand?.name || 'brand'}-${assetType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadAll = () => {
    // Create a zip-like content with all assets
    let allContent = `${currentBrand?.name} - Brand Package\n`;
    allContent += '='.repeat(50) + '\n\n';
    
    assets.forEach(asset => {
      if (asset.content) {
        allContent += `${asset.type.toUpperCase()}\n`;
        allContent += '-'.repeat(20) + '\n';
        allContent += asset.content + '\n\n';
      }
    });

    const element = document.createElement('a');
    const file = new Blob([allContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${currentBrand?.name || 'brand'}-complete-package.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareText = `I just created an amazing brand identity with Brandician AI! Check out what they can do for your business.`;
  const shareUrl = 'https://brandician.ai';

  if (isLoading || !currentBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-display font-bold text-neutral-800 mb-4">
              Congratulations! 🎉
            </h1>
            <p className="text-xl text-neutral-600 mb-2">
              Your brand <strong>{currentBrand.name}</strong> is ready to conquer the world!
            </p>
            <p className="text-lg text-neutral-500">
              Thank you for supporting our mission to help entrepreneurs build amazing brands.
            </p>
          </div>

          {/* Download Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-800">
                Download Your Brand Assets
              </h2>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 capitalize">
                    {asset.type.replace('_', ' ')}
                  </h3>
                  {asset.description && (
                    <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
                  )}
                  {asset.content && (
                    <button
                      onClick={() => handleDownload(asset.type, asset.content)}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  )}
                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium ml-4"
                    >
                      View Online
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
              What's Next?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Implement Your Brand:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use your brand assets across all touchpoints</li>
                  <li>• Apply your brand voice in all communications</li>
                  <li>• Ensure consistency across digital and print materials</li>
                  <li>• Train your team on brand guidelines</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Keep Growing:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Monitor brand perception and gather feedback</li>
                  <li>• Evolve your brand as your business grows</li>
                  <li>• Stay true to your brand archetype and values</li>
                  <li>• Consider creating more brands with us!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-6 flex items-center">
              <Share2 className="h-6 w-6 mr-2" />
              Share Your Success
            </h2>
            <p className="text-gray-600 mb-6">
              Help other entrepreneurs discover Brandician AI by sharing your experience:
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Twitter className="h-5 w-5 mr-2" />
                Share on Twitter
              </a>
              
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                Share on LinkedIn
              </a>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <Star className="h-4 w-4 inline mr-1" />
                <strong>Loved our service?</strong> Consider leaving us a review on social media or recommending us to fellow entrepreneurs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedContainer;