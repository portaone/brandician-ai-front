import axios, { AxiosInstance } from "axios";
import {
  CheckCircle,
  Download,
  Linkedin,
  Lock,
  Share2,
  Star,
  Twitter,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_URL, brands } from "../../lib/api";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import DownloadAllButton from "../common/DownloadAllButton";
import ShareLinkModal from "../common/ShareLinkModal";
import BrandicianLoader from "../common/BrandicianLoader";

const CompletedContainer: React.FC<{ readonlyMode?: boolean }> = ({
  readonlyMode,
}) => {
  const [searchParams] = useSearchParams();
  let { brandId } = useParams<{ brandId: string }>();
  const { currentBrand, selectBrand, isLoading } = useBrandStore();
  const [assets, setAssets] = useState<any[]>([]);
  const [assetContents, setAssetContents] = useState<{ [key: string]: any }>(
    {},
  );
  const [downloadLinks, setDownloadLinks] = useState<{ [key: string]: string }>(
    {},
  );
  const [testimonialData, setTestimonialData] = useState<any>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const token = searchParams.get("token") ?? "";

  let guestApi: AxiosInstance | undefined;

  const extractBrandIdFromToken = (jwtToken: string): string | null => {
    try {
      const parts = jwtToken.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.brand_id || null;
    } catch {
      return null;
    }
  };

  if (token && readonlyMode) {
    guestApi = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    brandId = extractBrandIdFromToken(token) as string | undefined;
  }

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId, guestApi);
    }

    // Load testimonial data from localStorage if available
    if (brandId) {
      const storedTestimonial = localStorage.getItem(`testimonial_${brandId}`);
      if (storedTestimonial) {
        try {
          setTestimonialData(JSON.parse(storedTestimonial));
        } catch (error) {
          console.error("Failed to parse testimonial data:", error);
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
        const response =
          token && readonlyMode
            ? await brands.listAssets(brandId, guestApi)
            : await brands.produceAssets(brandId);
        console.log("CompletedContainer - Assets response:", response);
        console.log(
          "CompletedContainer - Asset types:",
          response.assets.map((a: any) => a.type),
        );
        setAssets(response.assets);

        // Then fetch each asset's full content
        const contents: { [key: string]: any } = {};
        const links: { [key: string]: string } = {};

        for (const asset of response.assets) {
          try {
            const fullAsset = await brands.getAsset(
              brandId,
              asset.id,
              guestApi,
            );
            if (asset.type.includes("color")) {
              console.log(
                `CompletedContainer - Color asset (${asset.type}):`,
                fullAsset,
              );
            }
            contents[asset.type] = fullAsset;

            // Create blob URL for downloadable content if it has content
            if (fullAsset.content) {
              const blob = new Blob([fullAsset.content], {
                type: "text/plain",
              });
              links[asset.type] = URL.createObjectURL(blob);
            }
          } catch (error) {
            console.error(`Failed to load asset ${asset.type}:`, error);
          }
        }

        setAssetContents(contents);
        setDownloadLinks(links);
      } catch (error) {
        console.error("Failed to load assets:", error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    if (brandId) {
      loadAssets();
    }

    // Cleanup blob URLs on unmount
    return () => {
      Object.values(downloadLinks).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [brandId]);

  const handleDownload = (assetType: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${currentBrand?.name || "brand"}-${assetType}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareText = `I just created an amazing brand identity with Brandician AI! Check out what they can do for your business.`;
  const shareUrl = "https://brandician.ai";

  if (isLoading || !currentBrand) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          {readonlyMode ? (
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-full px-4 py-2 mx-auto mb-4">
                <Lock className="h-5 w-5 mr-2 text-neutral-600" />
                <span className="font-medium">Read-only view</span>
              </div>

              <h1 className="text-2xl font-display font-semibold text-neutral-800 mb-2">
                Viewing a snapshot of <strong>{currentBrand.name}</strong>
              </h1>
              <p className="text-sm text-neutral-500">
                This is a read-only version. Changes are disabled while viewing
                with a token.
              </p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-display font-bold text-neutral-800 mb-4">
                Congratulations! 🎉
              </h1>
              <p className="text-xl text-neutral-600 mb-2">
                Your brand <strong>{currentBrand.name}</strong> is ready to
                conquer the world!
              </p>
              <p className="text-lg text-neutral-500">
                Thank you for supporting our mission to help entrepreneurs build
                amazing brands.
              </p>
            </div>
          )}

          {/* Download Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-800">
                Download Your Brand Assets
              </h2>
              <div className="flex items-center flex-wrap gap-3">
                {!readonlyMode && (
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset, index) => {
                const fullAsset = assetContents[asset.type];
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="font-medium text-gray-900 mb-2 capitalize">
                      {asset.type.replace(/_/g, " ")}
                    </h3>
                    {fullAsset?.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {fullAsset.description}
                      </p>
                    )}
                    {fullAsset?.content && (
                      <button
                        onClick={() =>
                          handleDownload(asset.type, fullAsset.content)
                        }
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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              {/* Color Schema presenter removed as requested */}

              {brandId && (
                <DownloadAllButton
                  brandId={brandId}
                  brandName={currentBrand?.name || "brand"}
                  variant="button"
                  guestApi={guestApi}
                />
              )}
            </div>
          </div>

          {/* Next Steps */}
          {!readonlyMode && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
                  What's Next?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Implement Your Brand:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Use your brand assets across all touchpoints</li>
                      <li>• Apply your brand voice in all communications</li>
                      <li>
                        • Ensure consistency across digital and print materials
                      </li>
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
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-2xl font-semibold text-neutral-800 mb-6 flex items-center">
                  <Share2 className="h-6 w-6 mr-2" />
                  Share Your Success
                </h2>
                <p className="text-gray-600 mb-6">
                  Help other entrepreneurs discover Brandician AI by sharing
                  your experience:
                </p>

                <div className="flex flex-wrap gap-4">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      shareText,
                    )}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Twitter className="h-5 w-5 mr-2" />
                    Share on Twitter
                  </a>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      shareUrl,
                    )}`}
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
                    <strong>Loved our service?</strong> Consider leaving us a
                    review on social media or recommending us to fellow
                    entrepreneurs!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {brandId && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          brandId={brandId}
          brandName={currentBrand?.brand_name || currentBrand?.name}
        />
      )}
    </div>
  );
};

export default CompletedContainer;
