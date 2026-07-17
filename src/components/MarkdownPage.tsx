import React, { useCallback, useEffect, useState } from "react";
import MarkdownPreviewer from "./common/MarkDownPreviewer";
import BrandicianLoader from "./common/BrandicianLoader";
import ErrorScreen from "./common/ErrorScreen";

interface MarkdownPageProps {
  filePath: string;
  className?: string;
}

const MarkdownPage: React.FC<MarkdownPageProps> = ({ filePath, className }) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadContent = useCallback(() => {
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

  useEffect(() => {
    reloadContent();
  }, [reloadContent]);

  if (isLoading) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
        <span className="text-gray-600 ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        error={{ message: error, isNetworkError: false }}
        title="Couldn't load this page"
        showDashboard={false}
        onRetry={reloadContent}
      />
    );
  }

  return (
    <div className={className || "prose mx-auto max-w-3xl py-8"}>
      <MarkdownPreviewer markdown={content} />
    </div>
  );
};

export default MarkdownPage;
