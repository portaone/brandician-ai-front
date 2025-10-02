import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, CheckCircle, Star, Share2, Twitter, Linkedin, Palette } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { brands } from '../../lib/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Button from '../common/Button';

const CompletedContainer: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { currentBrand, selectBrand, isLoading } = useBrandStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [assetContents, setAssetContents] = useState<{[key: string]: any}>({});
  const [downloadLinks, setDownloadLinks] = useState<{[key: string]: string}>({});
  const [testimonialData, setTestimonialData] = useState<any>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

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
        setIsLoadingAssets(true);
        // First, produce/get the list of assets
        const response = await brands.produceAssets(brandId);
        console.log('CompletedContainer - Assets response:', response);
        console.log('CompletedContainer - Asset types:', response.assets.map((a: any) => a.type));
        setAssets(response.assets);

        // Then fetch each asset's full content
        const contents: {[key: string]: any} = {};
        const links: {[key: string]: string} = {};

        for (const asset of response.assets) {
          try {
            const fullAsset = await brands.getAsset(brandId, asset.id);
            if (asset.type.includes('color')) {
              console.log(`CompletedContainer - Color asset (${asset.type}):`, fullAsset);
            }
            contents[asset.type] = fullAsset;

            // Create blob URL for downloadable content if it has content
            if (fullAsset.content) {
              const blob = new Blob([fullAsset.content], { type: 'text/plain' });
              links[asset.type] = URL.createObjectURL(blob);
            }
          } catch (error) {
            console.error(`Failed to load asset ${asset.type}:`, error);
          }
        }

        setAssetContents(contents);
        setDownloadLinks(links);
      } catch (error) {
        console.error('Failed to load assets:', error);
      } finally {
        setIsLoadingAssets(false);
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

  const handleDownloadAll = async () => {
    try {
      setIsLoadingAssets(true);
      const zip = new JSZip();
      const brandName = currentBrand?.name || 'brand';

      // Create a folder for the brand
      const brandFolder = zip.folder(brandName);

      if (!brandFolder) {
        console.error('Failed to create folder in ZIP');
        return;
      }

      // Add each asset to the ZIP
      for (const [assetType, asset] of Object.entries(assetContents)) {
        if (asset && asset.content) {
          // Determine file extension based on content type
          let fileExtension = '.txt';
          let fileName = assetType.replace(/_/g, '-');

          // Check if content is JSON
          try {
            const parsed = JSON.parse(asset.content);
            fileExtension = '.json';
            // Format JSON nicely
            brandFolder.file(`${fileName}${fileExtension}`, JSON.stringify(parsed, null, 2));
          } catch {
            // Not JSON, check if it's other structured data
            if (asset.content.includes('http') && asset.content.includes('\n')) {
              // Likely URLs or similar
              fileExtension = '.txt';
            } else if (asset.content.includes('#') && asset.content.includes('rgb')) {
              // Likely color palette
              fileExtension = '.css';
            }
            brandFolder.file(`${fileName}${fileExtension}`, asset.content);
          }

          // Also add metadata if available
          if (asset.description) {
            brandFolder.file(`${fileName}-info.txt`, `Type: ${assetType}\nDescription: ${asset.description}\n`);
          }
        }
      }

      // Add a README file with brand information
      const readme = `${brandName} - Brand Package
${'='.repeat(50)}

Generated by Brandician AI
Date: ${new Date().toLocaleDateString()}

This package contains all your brand assets.

Contents:
${assets.map(asset => `- ${asset.type.replace(/_/g, ' ')}`).join('\n')}

Thank you for using Brandician AI!
Visit https://brandician.ai for more information.
`;
      brandFolder.file('README.txt', readme);

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download the ZIP file
      saveAs(zipBlob, `${brandName}-brand-assets.zip`);
    } catch (error) {
      console.error('Failed to create ZIP archive:', error);
      alert('Failed to create ZIP archive. Please try again.');
    } finally {
      setIsLoadingAssets(false);
    }
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

          {/* Color Schema Presenter Button */}
          <div className="mb-8 text-center">
            <Button
              size="xl"
              onClick={() => {
                // Open Color Schema Presenter in a popup window
                const width = 1500;
                const height = 1100;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                window.open(
                  `/brands/${brandId}/color-schema`,
                  'ColorSchemaPresenter',
                  `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                );
              }}
            >
              <Palette className="h-5 w-5 mr-2 inline" />
              View Color Schema Presenter
            </Button>
          </div>

          {/* Download Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-800">
                Download Your Brand Assets
              </h2>
              <Button
                size="lg"
                onClick={handleDownloadAll}
                disabled={isLoadingAssets || Object.keys(assetContents).length === 0}
              >
                <Download className={`h-5 w-5 mr-2 inline ${isLoadingAssets ? 'animate-spin' : ''}`} />
                {isLoadingAssets ? 'Preparing...' : 'Download All'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset, index) => {
                const fullAsset = assetContents[asset.type];
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2 capitalize">
                      {asset.type.replace(/_/g, ' ')}
                    </h3>
                    {fullAsset?.description && (
                      <p className="text-sm text-gray-600 mb-3">{fullAsset.description}</p>
                    )}
                    {fullAsset?.content && (
                      <button
                        onClick={() => handleDownload(asset.type, fullAsset.content)}
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    )}
                    {fullAsset?.url && (
                      <a
                        href={fullAsset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium ml-4"
                      >
                        View Online
                      </a>
                    )}
                  </div>
                );
              })}
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