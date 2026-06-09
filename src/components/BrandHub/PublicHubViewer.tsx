import { Loader } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { brands } from "../../lib/api";
import BrandHubCard from "./BrandHubCard";
import BrandHubTabBar from "./BrandHubTabBar";
import BrandHubTabPanel from "./BrandHubTabPanel";
import BrandThemeProvider from "./BrandThemeProvider";
import {
  TAB_CONFIGS,
  UiTabConfig,
  UiTabKey,
} from "./hub-tab-config";

// Public viewer omits the owner-only Gaps tab.
const PUBLIC_TAB_CONFIGS: UiTabConfig[] = TAB_CONFIGS.filter(
  (t) => t.key !== "gaps",
);

type HubMap = Record<string, string | Record<string, string> | null | undefined>;

interface PublicHub {
  brand_id: string;
  brand_name: string;
  tabs: Record<string, HubMap>;
}

const PublicHubViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UiTabKey>("strategy");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    brands
      .getPublicHubBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        setData(res as PublicHub);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const status = err?.response?.status;
        setError(
          status === 404
            ? "This hub isn't available."
            : err?.response?.data?.detail ??
                "We couldn't load this hub. Please try again.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Extract theme data from the visual_identity tab.
  const { colorPaletteJson, typographyJson } = useMemo(() => {
    const vi = data?.tabs?.visual_identity ?? {};
    return {
      colorPaletteJson:
        typeof vi.color_palette === "string" ? vi.color_palette : undefined,
      typographyJson:
        typeof vi.typography === "string" ? vi.typography : undefined,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Hub not found
          </h1>
          <p className="text-neutral-600 mb-6">
            {error ?? "This hub isn't available."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Visit Brandician
          </Link>
        </div>
      </div>
    );
  }

  const currentTabConfig = PUBLIC_TAB_CONFIGS.find((t) => t.key === activeTab)!;
  const currentHub = data.tabs[activeTab] ?? {};

  return (
    <BrandThemeProvider
      colorPaletteJson={colorPaletteJson}
      typographyJson={typographyJson}
    >
      <div
        className="min-h-screen py-8"
        style={{ background: "var(--brand-light)" }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header — read-only: brand name only, no owner controls */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-800">
                Brand Hub:{" "}
                <span className="text-3xl sm:text-4xl font-display font-bold text-[var(--brand-primary)]">
                  {data.brand_name}
                </span>
              </h1>
              <p className="text-neutral-600 mt-1 text-sm sm:text-base">
                A single place to explore this brand's strategy, positioning,
                visual identity, and voice.
              </p>
            </div>

            <BrandHubTabBar
              tabs={PUBLIC_TAB_CONFIGS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isGuest={true}
            />

            <BrandHubTabPanel description={currentTabConfig.description}>
              {currentTabConfig.properties.map((prop) => {
                const value = currentHub[prop.key];
                return (
                  <BrandHubCard
                    key={prop.key}
                    title={prop.title}
                    helper={prop.helper}
                    propKey={prop.key}
                    content={value}
                    confidence={null}
                    gapCount={0}
                    isGuest={true}
                    copiedKey={copiedKey}
                    onCopy={handleCopy}
                    brandId={data.brand_id}
                    colorPaletteJson={colorPaletteJson}
                    typographyJson={typographyJson}
                  />
                );
              })}
            </BrandHubTabPanel>

            <Link
              to="/register"
              className="mt-10 block rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow px-6 py-6 sm:px-8 sm:py-7 text-center group"
            >
              <p className="text-base sm:text-lg text-neutral-700 leading-relaxed">
                Do you like what you see? We can help you create a brand for
                your business, non-profit, or personal brand. Just register
                for your own{" "}
                <span className="font-semibold text-primary-600">
                  Brandician
                </span>{" "}
                account and start your brand journey!
              </p>
              <span className="inline-block mt-3 text-sm font-semibold tracking-wide uppercase text-primary-600 group-hover:translate-x-0.5 transition-transform">
                Start your brand journey →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </BrandThemeProvider>
  );
};

export default PublicHubViewer;
