import {
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileText,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../lib/api";
import { navigateAfterProgress } from "../../lib/navigation";
import { scrollToTop } from "../../lib/utils";
import { useBrandStore } from "../../store/brand";
import GetHelpButton from "../common/GetHelpButton";
import BrandicianLoader from "../common/BrandicianLoader";

const STEPS = [
  {
    title: "Share your story",
    desc: "We\u2019ll start with ~20 questions about your vision, your audience, and your goals. Speak plainly\u00a0\u2014 your natural voice is best. Feel free to use your microphone to make it easier.",
  },
  {
    title: "Tend to your strategy",
    desc: "We\u2019ll prepare a strategic profile and customer personas for you. Your role is to guide us\u00a0\u2014 review, refine, and ensure we\u2019ve captured your vision perfectly.",
  },
  {
    title: "Listen to your people",
    desc: "We\u2019ll create a survey for your potential customers. Once they respond, we\u2019ll adjust your brand based on their real needs.",
    badge: "Gathering feedback may take a few days",
  },
  {
    title: "Receive your Brand Hub",
    desc: "Everything you need to grow\u00a0\u2014 strategy, visual identity, and voice\u00a0\u2014 vetted by real people. A complete guide, ready to hand off to designers, developers, or your team.",
  },
];

const ExplanationScreen: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { progressBrandStatus, currentBrand, isLoading, selectBrand } =
    useBrandStore();

  // Internal step: 1 = intro, 2 = selector (code-only, no visible progress bar)
  const [step, setStep] = useState<1 | 2>(1);
  const [committed, setCommitted] = useState(false);

  // Selector state
  const [selectedPath, setSelectedPath] = useState<"questionnaire" | "upload">(
    "questionnaire",
  );
  const [uploadSubOption, setUploadSubOption] = useState<
    "file" | "text" | null
  >(null);

  // Upload / paste state (preserved from original)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId);
    }
  }, [brandId, currentBrand, selectBrand]);

  // --- Handlers (preserved logic) ---

  const handleProceed = async () => {
    if (!brandId) return;
    try {
      const statusUpdate = await progressBrandStatus(brandId);
      navigateAfterProgress(navigate, brandId, statusUpdate);
    } catch (error) {
      console.error("Failed to progress brand status:", error);
    }
  };

  const validateAndSetFile = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    const maxSize = 10 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Please upload a PDF, Word document, or text file");
      return false;
    }
    if (file.size > maxSize) {
      setUploadError("File size must be less than 10MB");
      return false;
    }
    setSelectedFile(file);
    setUploadError(null);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !brandId) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("brand_id", brandId);
      await api.post(`/api/v1.0/brands/${brandId}/upload-vision/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/brands/${brandId}/questionnaire?summary=1`);
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      setUploadError(
        error.response?.data?.message ||
          "Failed to upload document. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProcessText = async () => {
    if (!pastedText.trim() || !brandId) return;
    setIsProcessingText(true);
    setUploadError(null);
    try {
      const blob = new Blob([pastedText], { type: "text/plain" });
      const file = new File([blob], "brand-vision.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("document", file);
      formData.append("brand_id", brandId);
      await api.post(`/api/v1.0/brands/${brandId}/upload-vision/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/brands/${brandId}/questionnaire?summary=1`);
    } catch (error: any) {
      console.error("Failed to process text:", error);
      setUploadError(
        error.response?.data?.message ||
          "Failed to process text. Please try again.",
      );
    } finally {
      setIsProcessingText(false);
    }
  };

  // --- Selector handlers ---

  const handleSelectPath = (path: "questionnaire" | "upload") => {
    setSelectedPath(path);
    if (path === "questionnaire") {
      setUploadSubOption(null);
      setSelectedFile(null);
      setPastedText("");
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isStep2CTADisabled = () => {
    if (isUploading || isProcessingText) return true;
    if (selectedPath === "questionnaire") return false;
    if (uploadSubOption === "file") return !selectedFile;
    if (uploadSubOption === "text") return !pastedText.trim();
    return true;
  };

  const handleStep2CTA = async () => {
    if (selectedPath === "questionnaire") {
      await handleProceed();
    } else if (selectedPath === "upload") {
      if (uploadSubOption === "file" && selectedFile) {
        await handleUploadDocument();
      } else if (uploadSubOption === "text" && pastedText.trim()) {
        await handleProcessText();
      }
    }
  };

  // --- Loading state ---

  if (isLoading || !currentBrand) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="min-h-screen" style={{ padding: "16px 0" }}>
      <div
        className="container mx-auto flex justify-center"
        style={{ padding: "0 16px" }}
      >
        <AnimatePresence mode="wait">
          {/* ===================== STEP 1: INTRO ===================== */}
          {step === 1 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-[720px]"
              style={{
                background: "var(--color-white)",
                borderRadius: 16,
                padding: "48px",
              }}
            >
              <div className="card-intro" style={{ padding: 0 }}>
                {/* Header */}
                <div
                  className="flex justify-between items-start flex-col sm:flex-row"
                  style={{ marginBottom: 32, gap: 16 }}
                >
                  <h1
                    className="font-serif font-bold"
                    style={{
                      fontSize: "var(--fs-xl)",
                      color: "var(--color-text)",
                      lineHeight: 1.2,
                    }}
                  >
                    Before we begin
                  </h1>
                  <GetHelpButton variant="secondary" size="md" />
                </div>

                {/* Intro text */}
                <p
                  className="font-serif"
                  style={{
                    fontSize: "var(--fs-base)",
                    color: "var(--color-text)",
                    lineHeight: 1.65,
                    marginBottom: 36,
                  }}
                >
                  A great brand isn't built in a click&nbsp;&mdash; it's grown
                  with care. We've organized the journey into {STEPS.length}{" "}
                  structured steps designed to give your business the solid
                  foundation it deserves.
                </p>

                {/* Timeline steps */}
                <div className="flex flex-col" style={{ marginBottom: 36 }}>
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex relative" style={{ gap: 20 }}>
                      {/* Left: dot + connector */}
                      <div
                        className="relative flex-shrink-0"
                        style={{ paddingBottom: 28 }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            width: 10,
                            height: 10,
                            marginTop: 7,
                            background: "var(--color-secondary)",
                          }}
                        />
                        {i < STEPS.length - 1 && (
                          <div
                            className="absolute"
                            style={{
                              left: 4,
                              top: 20,
                              bottom: -4,
                              width: 2,
                              background: "var(--color-bg)",
                            }}
                          />
                        )}
                      </div>

                      {/* Right: content */}
                      <div className="flex-1" style={{ paddingBottom: 28 }}>
                        <div
                          className="font-serif font-semibold"
                          style={{
                            fontSize: "var(--fs-base)",
                            color: "var(--color-text)",
                            marginBottom: 4,
                          }}
                        >
                          {s.title}
                        </div>
                        <div
                          className="font-menu"
                          style={{
                            fontSize: "var(--fs-sm)",
                            color: "var(--color-secondary)",
                            lineHeight: 1.55,
                          }}
                        >
                          {s.desc}
                        </div>
                        {s.badge && (
                          <span
                            className="inline-block font-menu font-semibold uppercase"
                            style={{
                              fontSize: "0.72rem",
                              letterSpacing: "0.08em",
                              background: "rgba(244, 195, 67, 0.15)",
                              color: "#a07d10",
                              borderRadius: 4,
                              padding: "2px 8px",
                              marginTop: 6,
                            }}
                          >
                            {s.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Commitment checkbox */}
                <div
                  className="transition-all"
                  style={{
                    borderRadius: 12,
                    padding: "20px 24px",
                    marginBottom: 20,
                    border: `2px solid ${committed ? "var(--color-primary)" : "var(--color-light)"}`,
                    background: committed
                      ? "rgba(253, 97, 94, 0.04)"
                      : "var(--color-white)",
                  }}
                >
                  <label
                    className="flex items-start cursor-pointer"
                    style={{ gap: 14 }}
                  >
                    <div
                      className="relative flex-shrink-0"
                      style={{ marginTop: 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={committed}
                        onChange={(e) => setCommitted(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="flex items-center justify-center transition-all"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${committed ? "var(--color-primary)" : "var(--color-light)"}`,
                          background: committed
                            ? "var(--color-primary)"
                            : "white",
                        }}
                      >
                        {committed && (
                          <Check
                            className="text-white"
                            style={{ width: 10, height: 10 }}
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                    <span
                      className="font-menu font-medium"
                      style={{
                        fontSize: "var(--fs-base)",
                        color: "var(--color-text)",
                        lineHeight: 1.55,
                      }}
                    >
                      I understand that the quality of the output depends on the
                      quality of my input&nbsp;&mdash; and I'm ready to put in
                      the work.
                    </span>
                  </label>
                </div>

                {/* CTA */}
                <button
                  className="btn btn-primary w-full"
                  disabled={!committed}
                  onClick={() => {
                    setStep(2);
                    scrollToTop();
                  }}
                  style={
                    !committed
                      ? { background: "var(--color-light)" }
                      : undefined
                  }
                >
                  Got it, let's build my brand
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ===================== STEP 2: SELECTOR ===================== */}
          {step === 2 && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-[720px]"
              style={{
                background: "var(--color-white)",
                borderRadius: 16,
                padding: "48px",
              }}
            >
              <div className="card-selector">
                {/* Header */}
                <div
                  className="flex justify-between items-start flex-col sm:flex-row"
                  style={{ marginBottom: 12, gap: 16 }}
                >
                  <h1
                    className="font-serif font-bold"
                    style={{
                      fontSize: "var(--fs-xl)",
                      color: "var(--color-text)",
                      lineHeight: 1.2,
                    }}
                  >
                    How would you like to start?
                  </h1>
                  <GetHelpButton variant="secondary" size="md" />
                </div>

                {/* Subtitle */}
                <p
                  className="font-menu"
                  style={{
                    fontSize: "var(--fs-sm)",
                    color: "var(--color-secondary)",
                    marginBottom: 36,
                  }}
                >
                  Both paths lead to the same Brand Hub. Choose what works for
                  you.
                </p>

                {/* Path cards */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2"
                  style={{ gap: 16, marginBottom: 40 }}
                >
                  {/* Questionnaire card */}
                  <div
                    onClick={() => handleSelectPath("questionnaire")}
                    className="relative cursor-pointer transition-all flex flex-col"
                    style={{
                      borderRadius: 14,
                      padding: "28px 24px",
                      gap: 16,
                      border: `2px solid ${
                        selectedPath === "questionnaire"
                          ? "var(--color-primary)"
                          : "var(--color-light)"
                      }`,
                      boxShadow:
                        selectedPath === "questionnaire"
                          ? "0 4px 16px rgba(253, 97, 94, 0.12)"
                          : "none",
                    }}
                  >
                    {/* Recommended badge */}
                    <span
                      className="absolute font-menu font-bold uppercase"
                      style={{
                        top: -11,
                        left: 20,
                        fontSize: "0.7rem",
                        letterSpacing: "0.1em",
                        background: "var(--color-primary)",
                        color: "var(--color-white)",
                        borderRadius: 4,
                        padding: "3px 10px",
                      }}
                    >
                      Recommended
                    </span>

                    {/* Check circle */}
                    {selectedPath === "questionnaire" && (
                      <div
                        className="absolute flex items-center justify-center rounded-full"
                        style={{
                          top: 14,
                          right: 14,
                          width: 20,
                          height: 20,
                          background: "var(--color-primary)",
                        }}
                      >
                        <Check
                          className="text-white"
                          style={{ width: 11, height: 11 }}
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "var(--color-bg)",
                      }}
                    >
                      <ClipboardCheck
                        style={{
                          width: 22,
                          height: 22,
                          color:
                            selectedPath === "questionnaire"
                              ? "var(--color-primary)"
                              : "var(--color-secondary)",
                        }}
                      />
                    </div>

                    <div>
                      <div
                        className="font-serif font-semibold"
                        style={{
                          fontSize: "var(--fs-base)",
                          color: "var(--color-text)",
                          marginBottom: 6,
                        }}
                      >
                        Answer the questionnaire
                      </div>
                      <div
                        className="font-menu"
                        style={{
                          fontSize: "var(--fs-sm)",
                          color: "var(--color-secondary)",
                          lineHeight: 1.55,
                        }}
                      >
                        ~20 focused questions about your business, audience, and
                        goals. The most thorough path to a well-grounded brand
                        strategy.
                      </div>
                    </div>

                    <div
                      className="font-menu font-semibold"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-light)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      20&ndash;30 min
                    </div>
                  </div>

                  {/* Upload card */}
                  <div
                    onClick={() => handleSelectPath("upload")}
                    className="relative cursor-pointer transition-all flex flex-col"
                    style={{
                      borderRadius: 14,
                      padding: "28px 24px",
                      gap: 16,
                      border: `2px solid ${
                        selectedPath === "upload"
                          ? "var(--color-primary)"
                          : "var(--color-bg)"
                      }`,
                      boxShadow:
                        selectedPath === "upload"
                          ? "0 4px 16px rgba(253, 97, 94, 0.12)"
                          : "none",
                    }}
                  >
                    {/* Check circle */}
                    {selectedPath === "upload" && (
                      <div
                        className="absolute flex items-center justify-center rounded-full"
                        style={{
                          top: 14,
                          right: 14,
                          width: 20,
                          height: 20,
                          background: "var(--color-primary)",
                        }}
                      >
                        <Check
                          className="text-white"
                          style={{ width: 11, height: 11 }}
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "var(--color-bg)",
                      }}
                    >
                      <Upload
                        style={{
                          width: 22,
                          height: 22,
                          color:
                            selectedPath === "upload"
                              ? "var(--color-primary)"
                              : "var(--color-secondary)",
                        }}
                      />
                    </div>

                    <div>
                      <div
                        className="font-serif font-semibold"
                        style={{
                          fontSize: "var(--fs-base)",
                          color: "var(--color-text)",
                          marginBottom: 6,
                        }}
                      >
                        Upload a document
                      </div>
                      <div
                        className="font-menu"
                        style={{
                          fontSize: "var(--fs-sm)",
                          color: "var(--color-secondary)",
                          lineHeight: 1.55,
                        }}
                      >
                        Already have a brand brief, pitch deck, or business
                        description? Share it and we'll extract the answers
                        automatically.
                      </div>
                    </div>

                    <div
                      className="font-menu font-semibold"
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-light)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      PDF, DOC, DOCX, TXT, MD
                    </div>
                  </div>
                </div>

                {/* Upload area (slides in when upload selected) */}
                <AnimatePresence>
                  {selectedPath === "upload" && (
                    <motion.div
                      key="upload-area"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div
                        style={{
                          border: "2px dashed var(--color-light)",
                          borderRadius: 12,
                          padding: 24,
                          marginBottom: 24,
                          background: "var(--color-bg)",
                        }}
                      >
                        {/* Sub-option cards */}
                        <div
                          className="grid grid-cols-2"
                          style={{ gap: 12, marginBottom: 12 }}
                        >
                          <div
                            onClick={() => {
                              setUploadSubOption("file");
                              setPastedText("");
                            }}
                            className="text-center cursor-pointer transition-all"
                            style={{
                              background: "var(--color-white)",
                              borderRadius: 10,
                              padding: 16,
                              border: `1.5px solid ${uploadSubOption === "file" ? "var(--color-secondary)" : "var(--color-light)"}`,
                            }}
                          >
                            <Upload
                              className="mx-auto"
                              style={{
                                width: 24,
                                height: 24,
                                marginBottom: 8,
                                color: "var(--color-secondary)",
                              }}
                            />
                            <span
                              className="font-serif font-semibold block"
                              style={{
                                fontSize: "var(--fs-sm)",
                                marginBottom: 2,
                              }}
                            >
                              Upload a file
                            </span>
                            <span
                              className="font-menu"
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-light)",
                              }}
                            >
                              PDF, DOC, DOCX, TXT, MD
                            </span>
                          </div>

                          <div
                            onClick={() => {
                              setUploadSubOption("text");
                              setSelectedFile(null);
                              setUploadError(null);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                            className="text-center cursor-pointer transition-all"
                            style={{
                              background: "var(--color-white)",
                              borderRadius: 10,
                              padding: 16,
                              border: `1.5px solid ${uploadSubOption === "text" ? "var(--color-secondary)" : "var(--color-light)"}`,
                            }}
                          >
                            <Copy
                              className="mx-auto"
                              style={{
                                width: 24,
                                height: 24,
                                marginBottom: 8,
                                color: "var(--color-secondary)",
                              }}
                            />
                            <span
                              className="font-serif font-semibold block"
                              style={{
                                fontSize: "var(--fs-sm)",
                                marginBottom: 2,
                              }}
                            >
                              Paste text
                            </span>
                            <span
                              className="font-menu"
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-light)",
                              }}
                            >
                              Copy and paste your content
                            </span>
                          </div>
                        </div>

                        {/* File upload zone */}
                        <AnimatePresence>
                          {uploadSubOption === "file" && !selectedFile && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="flex flex-col items-center transition-colors"
                                style={{
                                  padding: "32px 0",
                                  marginTop: 12,
                                  borderRadius: 8,
                                  border: `2px dashed ${isDragging ? "var(--color-primary)" : "var(--color-light)"}`,
                                  background: isDragging
                                    ? "rgba(253, 97, 94, 0.04)"
                                    : "var(--color-white)",
                                }}
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  onChange={handleFileSelect}
                                  accept=".pdf,.doc,.docx,.txt,.md"
                                  className="hidden"
                                  id="document-upload"
                                />
                                <Upload
                                  style={{
                                    width: 40,
                                    height: 40,
                                    marginBottom: 12,
                                    color: isDragging
                                      ? "var(--color-primary)"
                                      : "var(--color-light)",
                                  }}
                                />
                                <label
                                  htmlFor="document-upload"
                                  className="btn btn-secondary cursor-pointer"
                                >
                                  Choose Document
                                </label>
                                <p
                                  className="font-menu"
                                  style={{
                                    fontSize: "var(--fs-sm)",
                                    color: "var(--color-light)",
                                    marginTop: 12,
                                  }}
                                >
                                  or drag and drop your file here
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Selected file display */}
                        <AnimatePresence>
                          {uploadSubOption === "file" && selectedFile && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              style={{ marginTop: 12 }}
                            >
                              <div
                                className="flex items-center justify-between"
                                style={{
                                  padding: 12,
                                  borderRadius: 8,
                                  background: "var(--color-white)",
                                }}
                              >
                                <div className="flex items-center flex-1">
                                  <FileText
                                    style={{
                                      width: 32,
                                      height: 32,
                                      marginRight: 12,
                                      color: "var(--color-light)",
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p
                                      className="font-menu font-semibold"
                                      style={{
                                        fontSize: "var(--fs-sm)",
                                        color: "var(--color-text)",
                                      }}
                                    >
                                      {selectedFile.name}
                                    </p>
                                    <p
                                      className="font-menu"
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "var(--color-light)",
                                      }}
                                    >
                                      {selectedFile.size < 1024 * 1024
                                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                        : `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={removeSelectedFile}
                                  className="rounded-full transition-colors"
                                  style={{
                                    marginLeft: 16,
                                    padding: 4,
                                    color: "var(--color-light)",
                                  }}
                                >
                                  <X style={{ width: 20, height: 20 }} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Paste textarea */}
                        <AnimatePresence>
                          {uploadSubOption === "text" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                              style={{ marginTop: 12 }}
                            >
                              <textarea
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                                placeholder="Paste your brand brief, business description, or any relevant text here..."
                                className="w-full font-menu resize-y outline-none transition-colors"
                                style={{
                                  minHeight: 120,
                                  padding: "14px 16px",
                                  borderRadius: 10,
                                  fontSize: "var(--fs-sm)",
                                  color: "var(--color-text)",
                                  border: "1.5px solid var(--color-light)",
                                  background: "var(--color-white)",
                                }}
                                onFocus={(e) =>
                                  (e.target.style.borderColor =
                                    "var(--color-secondary)")
                                }
                                onBlur={(e) =>
                                  (e.target.style.borderColor =
                                    "var(--color-light)")
                                }
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Note */}
                        <p
                          className="font-menu text-center"
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-light)",
                            marginTop: 12,
                          }}
                        >
                          We'll extract relevant answers and let you review them
                          before proceeding.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload error */}
                {uploadError && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(253, 97, 94, 0.06)",
                      border: "1px solid rgba(253, 97, 94, 0.2)",
                    }}
                  >
                    <p
                      className="font-menu"
                      style={{
                        fontSize: "var(--fs-sm)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {uploadError}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  className="btn btn-primary w-full"
                  disabled={isStep2CTADisabled()}
                  onClick={handleStep2CTA}
                >
                  {isUploading || isProcessingText ? (
                    <>
                      <div
                        className="animate-spin border-white border-t-transparent rounded-full"
                        style={{
                          width: 16,
                          height: 16,
                          borderWidth: 2,
                        }}
                      />
                      {isUploading
                        ? "Processing document..."
                        : "Processing text..."}
                    </>
                  ) : (
                    <>
                      {selectedPath === "questionnaire"
                        ? "Proceed to questionnaire"
                        : "Continue with document"}
                      <ChevronRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExplanationScreen;
