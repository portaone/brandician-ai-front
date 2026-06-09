import {
  BarChart3,
  History,
  MoreVertical,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendConfig } from "../../lib/api";
import { getRouteForStatus } from "../../lib/navigation";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import ShareHubModal from "../common/ShareHubModal";
import { Brand } from "../../types";
import BrandicianLoader from "../common/BrandicianLoader";

// Short names for step badge display
const STEP_SHORT_NAMES: Record<string, string> = {
  questionnaire: "Questionnaire",
  summary: "Summary",
  jtbd: "Personas",
  archetype: "Archetype",
  create_survey: "Survey",
  collect_feedback: "Feedback",
  feedback_review_summary: "Review: Summary",
  feedback_review_jtbd: "Review: Personas",
  primary_persona_selection: "Primary Persona",
  feedback_review_archetype: "Review: Archetype",
  pick_name: "Name",
  create_visual_identity: "Visual Identity",
  create_hub: "Brand Hub",
  create_assets: "Assets",
  testimonial: "Testimonial",
  payment: "Payment",
};

function getStepBadge(
  brand: Brand,
  statusSequence: Array<{ status: string; description: string }>,
): { label: string; isActive: boolean } {
  const isCompleted = brand.current_status === "completed";
  if (isCompleted) {
    return { label: "Brand hub", isActive: false };
  }

  // Build step number from sequence (excluding new_brand and completed)
  const steps = statusSequence.filter(
    (s) => s.status !== "new_brand" && s.status !== "completed",
  );
  const stepIndex = steps.findIndex(
    (s) => s.status === (brand.current_status || "new_brand"),
  );
  if (stepIndex >= 0) {
    const shortName =
      STEP_SHORT_NAMES[steps[stepIndex].status] ||
      steps[stepIndex].status.replace(/_/g, " ");
    return {
      label: `Step ${stepIndex + 1} \u2014 ${shortName}`,
      isActive: true,
    };
  }

  // Fallback for new_brand or unknown
  return { label: "Step 1 \u2014 Questionnaire", isActive: true };
}

const BrandList: React.FC = () => {
  const {
    brands,
    loadBrands,
    deleteBrand,
    updateBrandProjectName,
    isLoading,
    error,
  } = useBrandStore();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    brandId: string;
    brandName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameConfirm, setRenameConfirm] = useState<{
    brandId: string;
    brandName: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [shareBrand, setShareBrand] = useState<{
    id: string;
    name: string;
    slug?: string | null;
  } | null>(null);
  const [statusSequence, setStatusSequence] = useState<
    Array<{ status: string; description: string }>
  >([]);

  useEffect(() => {
    loadBrands();
    backendConfig
      .getConfig()
      .then((config) => setStatusSequence(config.status_sequence))
      .catch(console.error);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleContinue = (brandId: string, status: string) => {
    console.group("🚀 Navigating to brand component");
    console.log("Brand ID:", brandId);
    console.log("Current status:", status);
    const path = getRouteForStatus(brandId, status as any);
    console.log("Navigating to path:", path);
    console.groupEnd();

    navigate(path);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteBrand(deleteConfirm.brandId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete brand:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!renameConfirm || !renameValue.trim()) return;

    setIsRenaming(true);
    try {
      await updateBrandProjectName(renameConfirm.brandId, renameValue.trim());
      setRenameConfirm(null);
      setRenameValue("");
    } catch (error: any) {
      console.error("Failed to rename brand:", error);
      alert(
        `Failed to rename brand: ${
          error.response?.data?.detail || error.message
        }`,
      );
    } finally {
      setIsRenaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <BrandicianLoader />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-300px)]">
      <div className="space-y-6">
        <div className="flex justify-between flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 text-center sm:text-left">
            Your Brands
          </h2>
          <Button
            onClick={() => navigate("/brands/new")}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Create New Brand
          </Button>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No brands yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first brand to get started
            </p>
            <Button
              onClick={() => navigate("/brands/new")}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Create Brand
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => {
              const badge = getStepBadge(brand, statusSequence);
              return (
                <div
                  key={brand.id}
                  className="brand-card group bg-white rounded-lg p-4 flex flex-col relative"
                  style={{
                    border: "1.5px solid transparent",
                    cursor: "pointer",
                    transition:
                      "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
                    zIndex: openMenuId === brand.id ? 20 : undefined,
                  }}
                  onClick={() =>
                    handleContinue(
                      brand.id,
                      brand.current_status || "new_brand",
                    )
                  }
                >
                  {/* Header: name + menu */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="flex-1"
                      style={{
                        fontFamily: "var(--title-font-family)",
                        fontWeight: 700,
                        fontSize: "var(--fs-base)",
                        color: "var(--color-text)",
                      }}
                    >
                      {brand.name}
                      {brand.brand_name && brand.brand_name !== brand.name && (
                        <span
                          className="block font-normal"
                          style={{
                            fontSize: "var(--fs-sm)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {brand.brand_name}
                        </span>
                      )}
                    </h3>
                    <div
                      className="relative"
                      ref={(el) => (menuRefs.current[brand.id] = el)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === brand.id ? null : brand.id,
                          )
                        }
                        className="p-1 rounded-full transition-colors"
                        style={{ color: "var(--color-light)" }}
                        aria-label="More options"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === brand.id && (
                        <div
                          className="absolute right-4 top-6 xl:left-1 xl:right-auto 2xl:left-8 2xl:top-0 bg-white rounded-lg shadow-lg z-10 min-w-[250px]"
                          style={{
                            border: "1px solid var(--color-bg)",
                            boxShadow: "0 8px 24px rgba(56, 50, 54, 0.12)",
                            padding: "6px 0",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Group 1: Rename, History */}
                          <button
                            onClick={() => {
                              setRenameConfirm({
                                brandId: brand.id,
                                brandName: brand.name,
                              });
                              setRenameValue(brand.name);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left flex items-center gap-2 transition-colors first:rounded-t-lg"
                            style={{
                              padding: "10px 16px",
                              fontSize: "var(--fs-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              fontFamily: "'Source Sans 3', sans-serif",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--color-bg)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              style={{ color: "var(--color-light)" }}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h8.925l-2 2H5v14h14v-6.95l2-2V19q0 .825-.587 1.413T19 21zm4-6v-4.25l9.175-9.175q.3-.3.675-.45t.75-.15q.4 0 .763.15t.662.45L22.425 3q.275.3.425.663T23 4.4t-.137.738t-.438.662L13.25 15zM21.025 4.4l-1.4-1.4zM11 13h1.4l5.8-5.8l-.7-.7l-.725-.7L11 11.575zm6.5-6.5l-.725-.7zl.7.7z"
                              />
                            </svg>
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              navigate(`/brands/${brand.id}/history`);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left flex items-center gap-2 transition-colors"
                            style={{
                              padding: "10px 16px",
                              fontSize: "var(--fs-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              fontFamily: "'Source Sans 3', sans-serif",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--color-bg)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <History
                              className="h-3.5 w-3.5"
                              style={{ color: "var(--color-light)" }}
                            />
                            History
                          </button>

                          {/* Divider */}
                          <div
                            style={{
                              height: 1,
                              background: "var(--color-bg)",
                              margin: "4px 0",
                            }}
                          />

                          {/* Group 2: Share hub, Analytics */}
                          <button
                            onClick={() => {
                              setShareBrand({
                                id: brand.id,
                                name: brand.name,
                                slug: brand.hub_slug ?? null,
                              });
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left flex items-center gap-2"
                            style={{
                              padding: "10px 16px",
                              fontSize: "var(--fs-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              fontFamily: "'Source Sans 3', sans-serif",
                            }}
                          >
                            <Share2
                              className="h-3.5 w-3.5"
                              style={{ color: "var(--color-light)" }}
                            />
                            Share hub
                            {!brand.hub_slug && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  color: "var(--color-light)",
                                  marginLeft: "auto",
                                }}
                              >
                                not published
                              </span>
                            )}
                          </button>
                          <button
                            className="w-full text-left flex items-center gap-2"
                            style={{
                              padding: "10px 16px",
                              fontSize: "var(--fs-sm)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              fontFamily: "'Source Sans 3', sans-serif",
                              ...(!brand.hub_slug
                                ? {
                                    opacity: 0.35,
                                    cursor: "not-allowed",
                                    pointerEvents: "none" as const,
                                  }
                                : {}),
                            }}
                            onClick={() => setOpenMenuId(null)}
                          >
                            <BarChart3
                              className="h-3.5 w-3.5"
                              style={{ color: "var(--color-light)" }}
                            />
                            Analytics
                            {!brand.hub_slug && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  color: "var(--color-light)",
                                  marginLeft: "auto",
                                }}
                              >
                                not published
                              </span>
                            )}
                          </button>

                          {/* Divider */}
                          <div
                            style={{
                              height: 1,
                              background: "var(--color-bg)",
                              margin: "4px 0",
                            }}
                          />

                          {/* Group 3: Delete */}
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                brandId: brand.id,
                                brandName: brand.name,
                              });
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left flex items-center gap-2 transition-colors last:rounded-b-lg"
                            style={{
                              padding: "10px 16px",
                              fontSize: "var(--fs-sm)",
                              fontWeight: 600,
                              color: "var(--color-warning)",
                              fontFamily: "'Source Sans 3', sans-serif",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--color-bg)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Trash2
                              className="h-3.5 w-3.5"
                              style={{ color: "var(--color-warning)" }}
                            />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step badge */}
                  <div
                    className="step-badge"
                    style={
                      badge.isActive
                        ? {
                            color: "#a0722a",
                            background: "rgba(244, 195, 67, 0.15)",
                          }
                        : {
                            color: "#7f5971",
                            background: "rgba(127, 89, 113, 0.08)",
                          }
                    }
                  >
                    {badge.label}
                  </div>

                  {/* Status description */}
                  <div className="flex-grow">
                    <span
                      style={{
                        fontSize: "var(--fs-sm)",
                        color: "var(--color-light)",
                        lineHeight: 1.5,
                      }}
                    >
                      {brand.status_description || "Unknown status"}
                    </span>
                  </div>

                  {/* Footer: stats + arrow */}
                  <div
                    className="flex items-center justify-between"
                    style={{ marginTop: "auto", paddingTop: 14 }}
                  >
                    <div
                      style={{
                        fontSize: "var(--fs-sm)",
                        color: "var(--color-light)",
                      }}
                    >
                      {brand.hub_slug && (
                        <>
                          <span>
                            <strong
                              style={{
                                color: "var(--color-secondary)",
                                fontWeight: 600,
                              }}
                            >
                              {brand.hub_views ?? 0}
                            </strong>{" "}
                            views
                          </span>
                          <span style={{ margin: "0 10px" }} />
                          <span>
                            <strong
                              style={{
                                color: "var(--color-secondary)",
                                fontWeight: 600,
                              }}
                            >
                              {brand.hub_email_captures ?? 0}
                            </strong>{" "}
                            emails
                          </span>
                        </>
                      )}
                    </div>
                    <span
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        color: "var(--color-secondary)",
                        fontSize: 16,
                        transition: "opacity 0.15s, color 0.15s",
                      }}
                    >
                      &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      {renameConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-auto overscroll-none  z-50 p-4">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-lg max-w-md w-full p-2 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rename Brand
              </h3>
              <p className="text-gray-600 mb-4">
                This changes the project name for this brand. The actual brand
                name is chosen on step 9 of the brand creation process.
              </p>
              <div className="mb-6">
                <label
                  htmlFor="rename-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameValue.trim()) {
                      handleRename();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter project name"
                  autoFocus
                  disabled={isRenaming}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => {
                    setRenameConfirm(null);
                    setRenameValue("");
                  }}
                  variant="secondary"
                  disabled={isRenaming}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  variant="primary"
                  disabled={isRenaming || !renameValue.trim()}
                  loading={isRenaming}
                >
                  {isRenaming ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-auto overscroll-none z-50 p-4">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-lg max-w-md w-full p-2 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Brand
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "
                <strong>{deleteConfirm.brandName}</strong>"? This action cannot
                be undone and will permanently remove all data associated with
                this brand.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  variant="secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="primary"
                  disabled={isDeleting}
                  loading={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Brand"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Hub Modal */}
      <ShareHubModal
        isOpen={!!shareBrand}
        onClose={() => setShareBrand(null)}
        brandId={shareBrand?.id || ""}
        brandName={shareBrand?.name}
        initialSlug={shareBrand?.slug ?? null}
        onActivated={() => loadBrands()}
      />
    </div>
  );
};

export default BrandList;
