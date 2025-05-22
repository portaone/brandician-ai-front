import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Mic, MicOff, Loader, Wand2 } from 'lucide-react';
import { brands } from '../../lib/api';

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
  answerId
}) => {
  const [answer, setAnswer] = useState(currentAnswer || '');
  const [aiEnhancedAnswer, setAiEnhancedAnswer] = useState('');
  const [useAiAnswer, setUseAiAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const enhancementTimeoutRef = useRef<number>();

  // Update answer when currentAnswer changes (e.g., when navigating)
  useEffect(() => {
    setAnswer(currentAnswer || '');
    setAiEnhancedAnswer('');
    setUseAiAnswer(false);
    setHasBeenEdited(false);
  }, [currentAnswer, question]);

  useEffect(() => {
    return () => {
      if (enhancementTimeoutRef.current) {
        clearTimeout(enhancementTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    console.log('🎤 Starting recording...');
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Got audio stream');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('🎤 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('🎤 Recording stopped');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('🎤 Created audio blob:', audioBlob.size, 'bytes');
        await processAudioRecording(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('🔴 Failed to start recording:', error);
      setRecordingError('Failed to access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🎤 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    if (!answerId) {
      console.error('🔴 No answerId provided for audio processing');
      return;
    }
    
    console.log('🎤 Processing audio recording...');
    setIsProcessing(true);
    try {
      console.log('🎤 Uploading audio file...');
      const { id: processingId } = await brands.processAudio(brandId, answerId, audioBlob);
      console.log('🎤 Got processing ID:', processingId);
      
      const checkStatus = async () => {
        console.log('🎤 Checking processing status...');
        const status = await brands.getAudioProcessingStatus(brandId, answerId, processingId);
        console.log('🎤 Processing status:', status.status);
        
        if (status.status === 'completed' && status.text) {
          console.log('🎤 Processing completed:', status.text);
          setAnswer(status.text);
          setHasBeenEdited(true);
          requestAiEnhancement(status.text);
          setIsProcessing(false);
        } else if (status.status === 'failed') {
          console.error('🔴 Processing failed:', status.error);
          setRecordingError('Failed to process audio. Please try again or type your answer.');
          setIsProcessing(false);
        } else if (status.status === 'processing') {
          setTimeout(checkStatus, 2000);
        }
      };
      
      await checkStatus();
    } catch (error) {
      console.error('🔴 Failed to process audio:', error);
      setRecordingError('Failed to process audio. Please try again or type your answer.');
      setIsProcessing(false);
    }
  };

  const requestAiEnhancement = async (text: string) => {
    console.log('🔍 Starting requestAiEnhancement:', { 
      answerId, 
      textLength: text.trim().length, 
      hasBeenEdited,
      isEnhancing 
    });

    if (!answerId || !text.trim() || !hasBeenEdited) {
      console.log('⚠️ Skipping enhancement:', { 
        hasAnswerId: !!answerId, 
        textLength: text.trim().length, 
        hasBeenEdited 
      });
      return;
    }
    
    // Clear any pending enhancement request
    if (enhancementTimeoutRef.current) {
      console.log('🧹 Clearing previous timeout');
      clearTimeout(enhancementTimeoutRef.current);
    }
    
    // Set a new timeout for the enhancement request
    console.log('⏰ Setting new timeout for enhancement');
    enhancementTimeoutRef.current = setTimeout(async () => {
      console.log('⏰ Timeout triggered, checking isEnhancing:', isEnhancing);
      if (!isEnhancing) {
        console.log('🚀 Starting enhancement process');
        setIsEnhancing(true);
        try {
          console.log('🎯 Calling augmentAnswer API:', { brandId, answerId, text });
          const enhancedAnswer = await brands.augmentAnswer(brandId, answerId, text);
          console.log('✅ Got enhanced answer:', enhancedAnswer);
          setAiEnhancedAnswer(enhancedAnswer.answer);
        } catch (error: any) {
          console.error('🔴 Failed to enhance answer:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          }
        } finally {
          setIsEnhancing(false);
        }
      } else {
        console.log('⏳ Enhancement already in progress, skipping');
      }
    }, 1000);
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    console.log('📝 Answer changed:', { newAnswer, length: newAnswer.trim().length });
    setAnswer(newAnswer);
    setHasBeenEdited(true);
    
    // Request AI enhancement if the answer is long enough
    if (newAnswer.trim().length > 10) {
      console.log('🤖 Requesting AI enhancement for answer');
      requestAiEnhancement(newAnswer);
    }
  };

  const handleSubmit = async () => {
    const finalAnswer = useAiAnswer ? aiEnhancedAnswer : answer;
    if (!finalAnswer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onNext(finalAnswer);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 md:p-8">
      <h3 className="text-xl font-medium text-gray-800 mb-2">{question}</h3>
      {hint && (
        <p className="text-gray-600 mb-4 text-sm">{hint}</p>
      )}
      
      <div className="mb-6">
        <div className="relative">
          <textarea
            value={answer}
            onChange={handleAnswerChange}
            placeholder="Your answer"
            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[150px]"
          />
          
          <div className="absolute right-3 bottom-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Processing your recording...
          </div>
        )}
        
        {recordingError && (
          <div className="mt-2 text-sm text-red-500">
            {recordingError}
          </div>
        )}
      </div>
      
      {hasBeenEdited && answer.trim().length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              AI-enhanced answer
            </label>
            {isEnhancing && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Enhancing...
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 min-h-[100px]">
              {aiEnhancedAnswer || (
                <span className="text-gray-400">
                  AI enhancement will appear here...
                </span>
              )}
            </div>
            
            {aiEnhancedAnswer && (
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="useAiAnswer"
                  checked={useAiAnswer}
                  onChange={(e) => setUseAiAnswer(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useAiAnswer" className="ml-2 text-sm text-gray-700">
                  Use AI-enhanced version
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onPrevious}
          disabled={questionNumber === 1 || isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Previous
        </button>
        
        <div className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </div>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting || isProcessing}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader className="animate-spin h-5 w-5 mr-2" />
          ) : null}
          {isLastQuestion ? 'Finish' : 'Next'}
          {!isLastQuestion && <ArrowRight className="h-5 w-5 ml-2" />}
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireItem;