import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Copy,
  Mic,
  MicOff,
  Loader,
  RefreshCw,
  Wand2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { brands } from "../../lib/api";
import Button from "../common/Button";

interface QuestionnaireItemProps {
  question: string;
  hint?: string;
  onNext: (answer: string) => void;
  onPrevious: () => void;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
  currentAnswer?: string;
  brandId: string;
  answerId?: string;
  submitError?: string | null;
  onRetrySubmit?: () => void;
}

const QuestionnaireItem: React.FC<QuestionnaireItemProps> = ({
  question,
  hint,
  onNext,
  onPrevious,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  currentAnswer,
  brandId,
  answerId,
  submitError,
  onRetrySubmit,
}) => {
  const [answer, setAnswer] = useState(currentAnswer || "");
  const [aiEnhancedAnswer, setAiEnhancedAnswer] = useState("");
  const [useAiAnswer, setUseAiAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [augmentationError, setAugmentationError] = useState<string | null>(
    null
  );
  const [augmentationWarning, setAugmentationWarning] = useState<string | null>(
    null
  );
  const [noEnhancementNeeded, setNoEnhancementNeeded] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [lastEnhancedText, setLastEnhancedText] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const questionTitleRef = useRef<HTMLHeadingElement>(null);
  const enhancementTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const MAX_RECORDING_DURATION_MS = 180000; // 3 minutes
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Update answer when currentAnswer changes (e.g., when navigating)
  useEffect(() => {
    setAnswer(currentAnswer || "");
    setAiEnhancedAnswer("");
    setUseAiAnswer(false);
    setHasBeenEdited(false);
    setAugmentationError(null);
    setAugmentationWarning(null);
    setNoEnhancementNeeded(false);
    setLastEnhancedText("");
    // Scroll to question title when question changes
    setTimeout(() => {
      if (questionTitleRef.current) {
        const yOffset = -120; // Offset to account for fixed header and give breathing room
        const y =
          questionTitleRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  }, [currentAnswer, question]);

  useEffect(() => {
    return () => {
      if (enhancementTimeoutRef.current) {
        clearTimeout(enhancementTimeoutRef.current);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    console.log("🎤 Starting recording...");
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Got audio stream");

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("🎤 Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🎤 Recording stopped");
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        console.log("🎤 Created audio blob:", audioBlob.size, "bytes");
        await processAudioRecording(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("🎤 Recording started");

      // Set timeout to stop after 3 minutes
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION_MS);
    } catch (error) {
      console.error("🔴 Failed to start recording:", error);
      setRecordingError(
        "Failed to access microphone. Please ensure you have granted microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("🎤 Stopping recording...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Clear the timeout if user stops early
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    if (!answerId) {
      console.error("🔴 No answerId provided for audio processing");
      return;
    }

    console.log("🎤 Processing audio recording...");
    setIsProcessing(true);
    try {
      console.log("🎤 Uploading audio file...");
      const file = new File([audioBlob], "recording.webm", {
        type: audioBlob.type,
      });
      const { id: processingId } = await brands.processAudio(
        brandId,
        answerId,
        file
      );
      console.log("🎤 Got processing ID:", processingId);

      const checkStatus = async () => {
        console.log("🎤 Checking processing status...");
        const status = await brands.getAudioProcessingStatus(
          brandId,
          answerId,
          processingId
        );
        console.log("🎤 Processing status:", status.status);

        if (status.status === "completed") {
          if (status.text) {
            console.log("🎤 Processing completed:", status.text);
            setAnswer(status.text);
            setHasBeenEdited(true);
          } else {
            console.error("🔴 Processing completed but no text returned");
            setRecordingError(
              "Could not transcribe your audio into text. Please try again or type your answer."
            );
          }
          setIsProcessing(false);
        } else if (status.status === "failed") {
          console.error("🔴 Processing failed:", status.error);
          setRecordingError(
            status.error || "Failed to process audio. Please try again or type your answer."
          );
          setIsProcessing(false);
        } else if (status.status === "processing") {
          setTimeout(checkStatus, 2000);
        } else {
          // Unknown status - stop processing to avoid infinite loop
          console.error("🔴 Unknown processing status:", status.status);
          setRecordingError(
            "Unexpected error during audio processing. Please try again or type your answer."
          );
          setIsProcessing(false);
        }
      };

      await checkStatus();
    } catch (error) {
      console.error("🔴 Failed to process audio:", error);
      setRecordingError(
        "Failed to process audio. Please try again or type your answer."
      );
      setIsProcessing(false);
    }
  };

  const requestAiEnhancement = async (text: string) => {
    console.log("🔍 Starting requestAiEnhancement:", {
      answerId,
      textLength: text.trim().length,
      hasBeenEdited,
      isEnhancing,
    });

    if (!answerId || !text.trim()) {
      console.log("⚠️ Skipping enhancement:", {
        hasAnswerId: !!answerId,
        textLength: text.trim().length,
      });
      setNoEnhancementNeeded(false);
      setAugmentationError(null);
      setAugmentationWarning(null);
      setAiEnhancedAnswer("");
      return;
    }
    setNoEnhancementNeeded(false);

    // Clear any pending enhancement request
    if (enhancementTimeoutRef.current) {
      console.log("🧹 Clearing previous timeout");
      clearTimeout(enhancementTimeoutRef.current);
    }

    // Set a new timeout for the enhancement request
    console.log("⏰ Setting new timeout for enhancement");
    enhancementTimeoutRef.current = setTimeout(async () => {
      console.log("⏰ Timeout triggered, checking isEnhancing:", isEnhancing);
      if (!isEnhancing) {
        console.log("🚀 Starting enhancement process");
        setIsEnhancing(true);
        try {
          console.log("🎯 Calling augmentAnswer API:", {
            brandId,
            answerId,
            text,
          });
          const enhancedAnswer = await brands.augmentAnswer(
            brandId,
            answerId,
            text
          );
          console.log("🎯 Full API response:", enhancedAnswer);
          console.log("🎯 Response type:", typeof enhancedAnswer);
          console.log("🎯 Response keys:", Object.keys(enhancedAnswer || {}));

          if (
            enhancedAnswer &&
            enhancedAnswer.explanation?.includes("CANNOT AUGMENT")
          ) {
            console.log(
              "⚠️ Cannot augment answer:",
              enhancedAnswer.explanation
            );
            setAugmentationError(null);
            setAugmentationWarning(
              enhancedAnswer.explanation || "Cannot enhance this answer"
            );
            setAiEnhancedAnswer("");
          } else if (
            enhancedAnswer &&
            (enhancedAnswer.status === "Invalid answer" ||
              enhancedAnswer.status === "Meaningless answer")
          ) {
            console.log(
              "❌ Invalid/Meaningless answer detected:",
              enhancedAnswer.explanation
            );
            setAugmentationError(
              enhancedAnswer.explanation || "Invalid answer"
            );
            setAugmentationWarning(null);
            setAiEnhancedAnswer("");
          } else if (
            enhancedAnswer &&
            enhancedAnswer.status === "Cannot augment"
          ) {
            console.log(
              "⚠️ Cannot augment answer:",
              enhancedAnswer.explanation
            );
            setAugmentationError(null);
            setAugmentationWarning(
              enhancedAnswer.explanation || "Cannot enhance this answer"
            );
            setAiEnhancedAnswer("");
          } else {
            console.log(
              "✅ Setting enhanced answer:",
              enhancedAnswer?.answer || enhancedAnswer
            );
            setAugmentationError(null);
            setAugmentationWarning(null);
            // Try different possible response structures
            const answerText =
              enhancedAnswer?.answer ||
              enhancedAnswer?.enhanced_answer ||
              enhancedAnswer?.text ||
              enhancedAnswer;
            setAiEnhancedAnswer(
              typeof answerText === "string"
                ? answerText
                : JSON.stringify(answerText)
            );
          }
        } catch (error: any) {
          console.error("🔴 Failed to enhance answer:", error);
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
          }
        } finally {
          setIsEnhancing(false);
        }
      } else {
        console.log("⏳ Enhancement already in progress, skipping");
      }
    }, 1000);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    console.log("📝 Answer changed:", {
      newAnswer,
      length: newAnswer.trim().length,
    });
    setAnswer(newAnswer);
    setHasBeenEdited(true);

    // Clear submit error when user starts typing
    if (onRetrySubmit) {
      onRetrySubmit();
    }

    // Don't auto-trigger AI enhancement anymore
    // User will manually trigger it with a button
  };

  const handleEnhanceClick = () => {
    if (answer.trim().length > 10) {
      console.log("🤖 Manual AI enhancement requested");
      setLastEnhancedText(answer.trim()); // Track trimmed text that was enhanced
      requestAiEnhancement(answer);
    } else {
      // Show error for short answers
      setAugmentationError(
        "Please enter at least 10 characters to enhance your answer"
      );
      setAiEnhancedAnswer("");
      setAugmentationWarning(null);
      setNoEnhancementNeeded(false);
    }
  };

  const handleSubmit = async () => {
    const finalAnswer = useAiAnswer ? aiEnhancedAnswer : answer;
    if (augmentationError) return;
    setIsSubmitting(true);
    try {
      await onNext(finalAnswer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Remove both "SUGGESTED REVISION (fill the blanks):" and "SUGGESTED REVISION:" from the beginning
      const cleanText = aiEnhancedAnswer
        .replace(/SUGGESTED REVISION \(fill the blanks\):\s*/i, "")
        .replace(/SUGGESTED REVISION:\s*/i, "");
      await navigator.clipboard.writeText(cleanText);
      setCopyFeedback("Copied!");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      setCopyFeedback("Failed to copy");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-2 md:p-8 md:py-4">
      <h3
        ref={questionTitleRef}
        className="text-xl font-medium text-gray-800 mb-2"
      >
        {question}
      </h3>
      {hint && <p className="text-gray-600 mb-4 text-sm">{hint}</p>}

      <div className="mb-6">
        <div className="relative">
          <textarea
            rows={5}
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Your answer"
            className="w-full p-2 md:p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[150px]"
          />

          <div className="absolute right-3 bottom-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Tired of typing? You can dictate your answers (in English, please) by
          pressing the microphone icon
        </p>

        {answer.trim().length > 0 && (
          <Button
            type="button"
            onClick={handleEnhanceClick}
            disabled={
              isEnhancing ||
              (lastEnhancedText !== "" && answer.trim() === lastEnhancedText)
            }
            size="md"
            className="mt-3"
            title={
              lastEnhancedText !== "" && answer.trim() === lastEnhancedText
                ? "Text hasn't changed since last enhancement"
                : ""
            }
          >
            {isEnhancing ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2 inline" />
                Enhancing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2 inline" />
                {lastEnhancedText !== "" && answer.trim() === lastEnhancedText
                  ? "Already Enhanced"
                  : "Enhance with AI"}
              </>
            )}
          </Button>
        )}

        {isProcessing && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Processing your recording...
          </div>
        )}

        {recordingError && (
          <div className="mt-2 text-sm text-red-500">{recordingError}</div>
        )}
      </div>

      {(aiEnhancedAnswer ||
        augmentationError ||
        augmentationWarning ||
        noEnhancementNeeded) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              AI-enhanced answer
            </label>
          </div>

          <div className="relative">
            <div
              className="p-4 rounded-md min-h-[100px]"
              style={{
                backgroundColor: "#7F597120",
                borderColor: "#7F5971",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              {noEnhancementNeeded ? (
                <span className="text-gray-500">
                  Your answer seems to be very thorough, no need to further
                  enhance it
                </span>
              ) : augmentationError ? (
                <span className="text-red-500">{augmentationError}</span>
              ) : augmentationWarning ? (
                <span style={{ color: "#7F5971" }}>{augmentationWarning}</span>
              ) : aiEnhancedAnswer ? (
                <span style={{ color: "#7F5971" }}>{aiEnhancedAnswer}</span>
              ) : (
                <span className="text-gray-400">
                  AI enhancement will appear here...
                </span>
              )}
            </div>
            {aiEnhancedAnswer &&
              !augmentationError &&
              !augmentationWarning &&
              !noEnhancementNeeded && (
                <div className="mt-2 flex items-center">
                  {aiEnhancedAnswer.includes("SUGGESTED REVISION") ? (
                    <>
                      <button
                        onClick={copyToClipboard}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <span className="ml-2 text-sm text-gray-700">
                        {copyFeedback ||
                          "Please copy-paste the suggested revision above and fill the blanks"}
                      </span>
                    </>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        id="useAiAnswer"
                        checked={useAiAnswer}
                        onChange={(e) => setUseAiAnswer(e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="useAiAnswer"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Use AI-enhanced version
                      </label>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Submit Error Display */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">
                Failed to submit answer
              </p>
              <p className="text-red-600 text-sm mt-1">{submitError}</p>
            </div>
            {onRetrySubmit && (
              <button
                onClick={onRetrySubmit}
                className="ml-3 inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
            {/* Retry Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-3 inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-2">
        <Button
          type="button"
          onClick={onPrevious}
          disabled={questionNumber === 1 || isSubmitting}
          variant="secondary"
          size="md"
        >
          <ArrowLeft className="h-5 w-5 mr-2 inline" />
          Previous
        </Button>

        <div className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || isProcessing || !!augmentationError}
          size="md"
        >
          {isSubmitting ? (
            <Loader className="animate-spin h-5 w-5 mr-2 inline" />
          ) : null}
          {isLastQuestion ? "Finish" : "Next"}
          {!isLastQuestion && <ArrowRight className="h-5 w-5 ml-2 inline" />}
        </Button>
      </div>
    </div>
  );
};

export default QuestionnaireItem;
