import { Check, Copy, Loader2, Share2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { backendConfig, brands } from "../../lib/api";
import { getAppError } from "../../lib/errors";

interface ShareHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName?: string;
  initialSlug?: string | null;
  onActivated?: (slug: string, hubUrl: string) => void;
}

const DEFAULT_HUB_PATH = "/hub";

// Compose the full hub URL safely from origin + path + slug. Using the URL
// constructor guarantees correct slashing regardless of how hub_path is
// written. An empty/root hub_path puts the slug directly at the host root.
function composeHubUrl(hubPath: string, slug: string): string {
  const stripped = hubPath.replace(/^\/+|\/+$/g, "");
  const cleanPath = stripped ? `/${stripped}` : "";
  return new URL(`${cleanPath}/${slug}`, window.location.origin).toString();
}

// "localhost:8501/hub/" — host + path with trailing slash. Used as the
// non-editable chip and as the prefix shown in the URL preview.
function composeHubPrefixDisplay(hubPath: string): string {
  const stripped = hubPath.replace(/^\/+|\/+$/g, "");
  const cleanPath = stripped ? `/${stripped}` : "/";
  const base = new URL(cleanPath, window.location.origin);
  const path = base.pathname.endsWith("/") ? base.pathname : base.pathname + "/";
  return `${base.host}${path}`;
}

const SLUG_DEBOUNCE_MS = 400;

// Derive a slug suggestion from a free-form brand name. Lowercases, strips
// diacritics, replaces any run of non-alphanumerics with a single dash, and
// trims dashes from the ends. The result may still fail backend validation
// (e.g. too short) — the availability check surfaces that.
function suggestSlug(name: string | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ShareHubModal: React.FC<ShareHubModalProps> = ({
  isOpen,
  onClose,
  brandId,
  brandName = "brand",
  initialSlug,
  onActivated,
}) => {
  const [slug, setSlug] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [hubPath, setHubPath] = useState<string>(DEFAULT_HUB_PATH);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state from the brand each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    const persisted = (initialSlug ?? "").toLowerCase();
    // Pre-fill with the persisted slug if any; otherwise suggest one
    // derived from the brand name so the user has a sensible starting point.
    const seed = persisted || suggestSlug(brandName);
    setSlug(seed);
    setSavedSlug(persisted || null);
    // Persisted slugs are by definition available; a suggestion needs the
    // backend to confirm before we light up the ✓.
    setAvailable(persisted ? true : null);
    setAvailabilityReason(null);
    setActivationError(null);
    setCopied(false);
  }, [isOpen, initialSlug, brandName]);

  // Fetch the hub path from /config once per session. The deduplicate
  // helper in api.ts ensures concurrent modal opens share one request.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    backendConfig
      .getConfig()
      .then((cfg) => {
        if (!cancelled && cfg.hub_path) setHubPath(cfg.hub_path);
      })
      .catch(() => {
        // Fall back to the in-code default; nothing user-visible breaks.
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Debounced availability check.
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setActivationError(null);

    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) {
      setAvailable(null);
      setAvailabilityReason(null);
      setIsChecking(false);
      return;
    }
    if (savedSlug && trimmed === savedSlug) {
      setAvailable(true);
      setAvailabilityReason(null);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await brands.checkHubSlugAvailability(brandId, trimmed);
        // Ignore stale responses if the user kept typing.
        if (res.slug !== trimmed) return;
        setAvailable(res.available);
        setAvailabilityReason(res.reason ?? null);
      } catch (err: any) {
        setAvailable(false);
        setAvailabilityReason(
          getAppError(err, "Could not check availability").message,
        );
      } finally {
        setIsChecking(false);
      }
    }, SLUG_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug, brandId, isOpen, savedSlug]);

  const handleActivate = async () => {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed || !available || isActivating) return;
    setIsActivating(true);
    setActivationError(null);
    try {
      const res = await brands.activateHub(brandId, trimmed);
      setSavedSlug(res.slug);
      // Don't notify the parent yet — refreshing brand state here would
      // flip a parent-level isLoading flag and unmount this modal,
      // making the Copy-link state never visible. We notify on close.
    } catch (err: any) {
      setActivationError(
        getAppError(err, "Could not activate the hub. Try again.").message,
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleClose = () => {
    // Notify the parent only when the user dismisses the modal so the
    // parent's refetch (which toggles its isLoading state) doesn't
    // unmount the modal mid-flight.
    const initial = (initialSlug ?? "").toLowerCase() || null;
    if (savedSlug && savedSlug !== initial) {
      onActivated?.(savedSlug, composeHubUrl(hubPath, savedSlug));
    }
    onClose();
  };

  const handleCopy = async () => {
    if (!savedSlug) return;
    const url = composeHubUrl(hubPath, savedSlug);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen) return null;

  const trimmed = slug.trim().toLowerCase();
  const isSavedAndUnchanged = !!savedSlug && trimmed === savedSlug;
  const canActivate =
    !!trimmed && available === true && !isActivating && !isChecking;
  const showCopyLink = isSavedAndUnchanged;
  const showError =
    available === false && !isChecking && trimmed.length > 0;
  // Always show the URL preview while the user is typing a valid candidate
  // — gives live "what this will look like" feedback per the mock.
  const showUrlPreview = trimmed.length > 0;
  // Edition label always reflects the current month so visitors know the
  // hub stays in sync with the brand's current state.
  const now = new Date();
  const editionLabel = `${now.toLocaleString("default", {
    month: "long",
  })} ${now.getFullYear()} edition`;
  const upsellSlug = trimmed || "yourbrand";
  // Chip prefix and apex host are both derived from the current page's
  // origin + backend-supplied hub_path — no hardcoded brandician.ai.
  const hubPrefixDisplay = composeHubPrefixDisplay(hubPath);
  const apexHost = window.location.hostname;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        style={{ fontFamily: "'Source Sans 3', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6">
          <div className="flex items-center gap-2.5">
            <Share2 className="h-[18px] w-[18px] text-primary-600" />
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "'Bitter', serif" }}
            >
              Share brand hub
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 pt-5 pb-7 flex flex-col gap-5">
          <div>
            <div
              className="text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: "var(--color-secondary, #7f5971)" }}
            >
              Your hub address
            </div>
            <div
              className={`flex items-stretch border-[1.5px] rounded-xl overflow-hidden transition-colors ${
                showError ? "border-primary-600" : "border-gray-300"
              }`}
            >
              <span
                className="px-3.5 py-2.5 text-sm whitespace-nowrap bg-gray-100"
                style={{ color: "var(--color-light, #bfacb8)" }}
              >
                {hubPrefixDisplay}
              </span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  )
                }
                placeholder="your-handle"
                className="flex-1 px-2.5 py-2.5 text-sm outline-none min-w-0"
                autoFocus
                disabled={isActivating}
              />
              <span className="px-3.5 py-2.5 text-sm flex items-center">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : available === true && trimmed ? (
                  <span className="text-green-700">✓</span>
                ) : null}
              </span>
            </div>
            {showError && availabilityReason && (
              <p
                className="text-sm mt-1.5"
                style={{ color: "var(--color-primary, #fd615e)" }}
              >
                {availabilityReason}
              </p>
            )}
            {showUrlPreview && (
              <div
                className="mt-2.5 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "var(--color-bg, #f4f2f2)",
                  color: "var(--color-light, #bfacb8)",
                }}
              >
                {hubPrefixDisplay}
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-primary, #fd615e)" }}
                >
                  {trimmed}
                </span>
              </div>
            )}
          </div>

          {/* Edition / freshness statement — always shown */}
          <div
            className="border-t pt-4 flex items-center justify-between gap-3"
            style={{ borderColor: "var(--color-bg, #f4f2f2)" }}
          >
            <div>
              <div
                className="text-sm font-semibold"
                style={{ color: "var(--color-text, #383236)" }}
              >
                {editionLabel}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--color-light, #bfacb8)" }}
              >
                Updates automatically — visitors always see the latest version of your brand
              </div>
            </div>
            <span
              className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{
                background: "rgba(244, 195, 67, 0.2)",
                color: "#a0722a",
              }}
            >
              Free
            </span>
          </div>

          {activationError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {activationError}
            </div>
          )}

          {showCopyLink ? (
            <button
              onClick={handleCopy}
              className="w-full uppercase tracking-widest text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors"
              style={{
                background: copied ? "#2d7a4f" : "var(--color-primary, #fd615e)",
                color: "white",
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={!canActivate}
              className="w-full uppercase tracking-widest text-sm font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-opacity"
              style={{
                background: "var(--color-primary, #fd615e)",
                color: "white",
                opacity: canActivate ? 1 : 0.4,
                cursor: canActivate ? "pointer" : "not-allowed",
              }}
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating…
                </>
              ) : (
                "Activate Sharing"
              )}
            </button>
          )}

          {/* Pro upsell — custom subdomain on Pro plan */}
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: "rgba(244, 195, 67, 0.12)" }}
          >
            <span className="text-xs" style={{ color: "#a0722a" }}>
              Get{" "}
              <span className="font-bold">
                {upsellSlug}.{apexHost}
              </span>{" "}
              on Pro
            </span>
            <span
              className="text-xs font-bold tracking-wider whitespace-nowrap cursor-pointer"
              style={{ color: "var(--color-primary, #fd615e)" }}
            >
              Upgrade →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareHubModal;
