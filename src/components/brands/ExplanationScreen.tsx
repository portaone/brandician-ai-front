import { ArrowRight, Copy, FileEdit, FileText, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import GetHelpButton from "../common/GetHelpButton";

const ExplanationScreen: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const {
    updateBrandStatus,
    progressBrandStatus,
    currentBrand,
    isLoading,
    selectBrand,
  } = useBrandStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMethod, setInputMethod] = useState<"file" | "text" | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [isProcessingText, setIsProcessingText] = useState(false);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  const handleProceed = async () => {
    if (!brandId) return;

    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to progress brand status:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        setUploadError("Please upload a PDF, Word document, or text file");
        return;
      }

      if (file.size > maxSize) {
        setUploadError("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !brandId) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("brand_id", brandId);

      const response = await api.post(
        `/api/v1.0/brands/${brandId}/upload-vision/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // If successful, go directly to questionnaire with summary parameter
      // Don't progress status, let the questionnaire page handle that
      navigate(`/brands/${brandId}/questionnaire?summary=1`);
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      setUploadError(
        error.response?.data?.message ||
          "Failed to upload document. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProcessText = async () => {
    if (!pastedText.trim() || !brandId) return;

    setIsProcessingText(true);
    setUploadError(null);

    try {
      // Create a text file blob from the pasted content
      const blob = new Blob([pastedText], { type: "text/plain" });
      const file = new File([blob], "brand-vision.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("document", file);
      formData.append("brand_id", brandId);

      const response = await api.post(
        `/api/v1.0/brands/${brandId}/upload-vision/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // If successful, go directly to questionnaire with summary parameter
      // Don't progress status, let the questionnaire page handle that
      navigate(`/brands/${brandId}/questionnaire?summary=1`);
    } catch (error: any) {
      console.error("Failed to process text:", error);
      setUploadError(
        error.response?.data?.message ||
          "Failed to process text. Please try again."
      );
    } finally {
      setIsProcessingText(false);
    }
  };

  const resetInputMethod = () => {
    setInputMethod(null);
    setSelectedFile(null);
    setPastedText("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 py-4 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-2 md:p-8">
            <div className="flex justify-between items-center flex-wrap mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Process overview
              </h2>
              <div className="flex items-center flex-wrap gap-3">
                <GetHelpButton variant="secondary" size="md" />
              </div>
            </div>
            <div className="space-y-6 text-neutral-600">
              <p>
                We will build a brand identity and brand access for your
                business. Your brand identity is more than just a logo or color
                scheme—it's your archetype, your tone of voice, your promise to
                customers, and your ability to meet their needs.
              </p>

              <p>
                To create something that drives your success, we need thoughtful
                input from you. Here's the process:
              </p>

              <div className="space-y-8 mt-8">
                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">
                    Tell us about your business or service
                  </h3>
                  <p>
                    Complete the questionnaire. You can record your answers
                    using your microphone to save time. Speak plainly—like
                    you're talking to a friend or a child. Skip the corporate
                    buzzwords and empty marketing jargon. There are 20+
                    questions, so set aside 20–30 minutes to finish it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">
                    We create your strategic profile
                  </h3>
                  <p>
                    This is an executive summary of your business. You'll review
                    and edit it to make sure it's accurate.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">
                    We define profiles of your future customers
                  </h3>
                  <p>
                    We build Jobs-to-be-Done (JTBD) personas—detailed profiles
                    that capture different customer needs and motivations. If
                    anything feels off, you'll have a chance to refine it.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">
                    We test your brand hypothesis
                  </h3>
                  <p>
                    The wrong way to build a brand? Lock yourself in a garage,
                    create a product for months, then realize no one wants it.
                    Instead, we validate your ideas early. We design a customer
                    questionnaire—you share it with people who might be your
                    future customers, so they submit the real input. Believe us,
                    many founders are surprised by the results! Based on real
                    customer feedback, we adjust the brand vision as needed.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-neutral-800 mb-2">
                    Voila! We generate your brand assets
                  </h3>
                  <p>
                    Then, we pick your archetype, tone of voice, and visual
                    assets, ensuring AI-generated content aligns with your
                    brand's style.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="font-bold text-neutral-800">
                  Ready? Let's get started.
                </p>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="mt-8 p-2 md:p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Alternative: Provide Your Brand Vision
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Share your brand vision document to extract answers
                automatically and speed up the process.
              </p>

              {/* Input Method Selection */}
              {!inputMethod && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setInputMethod("file")}
                    className="flex flex-col items-center p-6 bg-white rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                  >
                    <Upload className="h-10 w-10 text-gray-400 group-hover:text-primary-600 mb-3" />
                    <span className="font-medium text-gray-900">
                      Upload Document
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT, or MD
                    </span>
                  </button>

                  <button
                    onClick={() => setInputMethod("text")}
                    className="flex flex-col items-center p-6 bg-white rounded-lg border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                  >
                    <Copy className="h-10 w-10 text-gray-400 group-hover:text-primary-600 mb-3" />
                    <span className="font-medium text-gray-900">
                      Paste Text
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Copy and paste your content
                    </span>
                  </button>
                </div>
              )}

              {/* File Upload UI */}
              {inputMethod === "file" && (
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Upload Your Document
                    </h4>
                    <button
                      onClick={resetInputMethod}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change method
                    </button>
                  </div>

                  {!selectedFile && (
                    <div className="flex flex-col items-center py-8">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt,.md"
                        className="hidden"
                        id="document-upload"
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Upload className="mr-2 h-5 w-5" />
                        Choose Document
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}

                  {selectedFile && (
                    <>
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center flex-1">
                          <FileText className="h-8 w-8 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeSelectedFile}
                          className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <Button
                        onClick={handleUploadDocument}
                        disabled={isUploading}
                        size="lg"
                        className="mt-4 w-full"
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
                            Processing Document...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4 inline" />
                            Upload and Process Document
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Text Paste UI */}
              {inputMethod === "text" && (
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Paste Your Brand Vision
                    </h4>
                    <button
                      onClick={resetInputMethod}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Change method
                    </button>
                  </div>

                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste your brand vision document here. Include information about your mission, target audience, values, unique value proposition, and any other relevant details..."
                    className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {pastedText.length} characters
                    </span>
                    <span className="text-xs text-gray-500">
                      Tip: Include as much detail as possible for better results
                    </span>
                  </div>

                  <Button
                    onClick={handleProcessText}
                    disabled={!pastedText.trim() || isProcessingText}
                    size="lg"
                    className="mt-4 w-full"
                  >
                    {isProcessingText ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
                        Processing Text...
                      </>
                    ) : (
                      <>
                        <FileEdit className="mr-2 h-4 w-4 inline" />
                        Process Text
                      </>
                    )}
                  </Button>
                </div>
              )}

              {uploadError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
            </div>

            {/* Original Proceed Button */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  Or continue with the questionnaire:
                </span>
              </div>
              <Button onClick={handleProceed} size="lg">
                Proceed to Questionnaire
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationScreen;
