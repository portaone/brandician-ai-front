import { AlertCircle, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownPageProps {
  filePath: string;
  className?: string;
}

const MarkdownPage: React.FC<MarkdownPageProps> = ({ filePath, className }) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load content");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load content");
        setIsLoading(false);
      });
  }, [filePath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
        <span className="text-gray-600 ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
        <span className="text-red-600">{error}</span>
      </div>
    );
  }

  return (
    <div className={className || "prose mx-auto max-w-3xl py-8"}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownPage;
