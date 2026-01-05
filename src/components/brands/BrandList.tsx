import {
  Copy,
  Edit2,
  History,
  Link,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { brands as brandsApi } from "../../lib/api";
import { getRouteForStatus } from "../../lib/navigation";
import { useAuthStore } from "../../store/auth";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import { Brand } from "../../types";

const BrandList: React.FC = () => {
  const {
    brands,
    loadBrands,
    deleteBrand,
    updateBrandProjectName,
    isLoading,
    error,
  } = useBrandStore();
  const { user } = useAuthStore();
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

  const isAdmin = user?.admin || false;

  useEffect(() => {
    loadBrands();
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

  const handleClone = async (brandId: string, brandName: string) => {
    if (
      !confirm(
        `Are you sure you want to clone "${brandName}"? This will create an exact copy of the brand with all its data.`
      )
    ) {
      return;
    }

    try {
      const clonedBrand = await brandsApi.cloneBrand(brandId);
      console.log("Brand cloned successfully:", clonedBrand);
      // Reload brands to show the new clone
      await loadBrands();
      alert(`Successfully cloned "${brandName}" as "${clonedBrand.name}"`);
    } catch (error: any) {
      console.error("Failed to clone brand:", error);
      alert(
        `Failed to clone brand: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
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
        }`
      );
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCopyLink = async (brand: Brand) => {
    const route = getRouteForStatus(
      brand.id,
      (brand.current_status || "new_brand") as any
    );
    const fullUrl = `${window.location.origin}${route}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setOpenMenuId(null);
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = fullUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setOpenMenuId(null);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textarea);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
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
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow flex flex-col relative"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 flex-1">
                    {brand.name}
                  </h3>
                  <div
                    className="relative"
                    ref={(el) => (menuRefs.current[brand.id] = el)}
                  >
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === brand.id ? null : brand.id)
                      }
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>
                    {openMenuId === brand.id && (
                      <div className="absolute right-4 top-6 xl:left-1 xl:right-auto 2xl:left-8 2xl:top-0 bg-white rounded-lg border border-gray-200 shadow-lg z-10 min-w-[180px]">
                        <button
                          onClick={() => {
                            setRenameConfirm({
                              brandId: brand.id,
                              brandName: brand.name,
                            });
                            setRenameValue(brand.name);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm first:rounded-t-lg"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Rename</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              handleClone(brand.id, brand.name);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Clone</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigate(`/brands/${brand.id}/history`);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>History</span>
                        </button>
                        <button
                          onClick={() => handleCopyLink(brand)}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                        >
                          <Link className="h-3.5 w-3.5" />
                          <span>Copy link</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              brandId: brand.id,
                              brandName: brand.name,
                            });
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors text-red-600 text-sm last:rounded-b-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {brand.description && (
                  <p className="text-gray-500 mb-4 line-clamp-2">
                    {brand.description}
                  </p>
                )}
                <div className="flex-grow">
                  <span className="text-sm text-gray-500">
                    Status: {brand.status_description || "Unknown status"}
                  </span>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() =>
                      handleContinue(
                        brand.id,
                        brand.current_status || "new_brand"
                      )
                    }
                    variant="primary"
                    className="w-full"
                  >
                    Open
                  </Button>
                </div>
              </div>
            ))}
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
                  variant="danger"
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
    </div>
  );
};

export default BrandList;
