import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { brands } from "../../lib/api";

/**
 * Only http(s) destinations are safe to hand to window.location. This blocks a
 * `javascript:`/`data:` URI ever reaching the navigation sink. Defense in
 * depth — the backend only ever stores Google Forms https links today, but the
 * resolve response should never be trusted blindly at the sink.
 */
const isSafeHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

/**
 * Public landing page for a short survey link (`/survey/:code`).
 *
 * Resolves the code to its destination via the public backend endpoint, then
 * replaces the current history entry with the destination so the short URL
 * doesn't linger in the respondent's back button. Shows a brief "redirecting"
 * state, and a friendly fallback if the code is unknown.
 */
const SurveyRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) {
      setNotFound(true);
      return;
    }
    let cancelled = false;
    brands
      .resolveSurveyShortCode(code)
      .then((res) => {
        if (cancelled) return;
        const dest = res?.target_url;
        if (dest && isSafeHttpUrl(dest)) {
          window.location.replace(dest);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-2">
          This survey link isn't available
        </h1>
        <p className="text-neutral-600 mb-6">
          The link may be mistyped or no longer active.
        </p>
        <Link to="/" className="text-primary-600 hover:underline">
          Go to Brandician.AI
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <Loader className="animate-spin h-8 w-8 text-primary-600 mb-4" />
      <p className="text-neutral-600">Redirecting to the survey…</p>
    </div>
  );
};

export default SurveyRedirect;
