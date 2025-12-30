import React from "react";
import { useParams } from "react-router-dom";
import { extractBrandColors, useBrandColors } from "../../hooks/useBrandColors";
import { useBrandStore } from "../../store/brand";
import BrandComponent from "../common/BrandComponent";

const BrandComponentExample: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand } = useBrandStore();

  // Extract colors from current brand data
  const brandColors = extractBrandColors(currentBrand);

  // Use the hook to get final colors
  const colors = useBrandColors({
    brandName: currentBrand?.name,
    customColors: brandColors,
    archetype: currentBrand?.archetype,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Brand Component Showcase
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default colors */}
          <BrandComponent
            title="Default Brand"
            description="This component uses the default color scheme."
          />

          {/* Brand-specific colors */}
          <BrandComponent
            colors={colors}
            title={currentBrand?.name || "Your Brand"}
            description="This component uses colors derived from your brand data."
          />

          {/* Custom colors */}
          <BrandComponent
            colors={{
              primary: "#FF6B6B",
              secondary: "#4ECDC4",
              accent: "#FFE66D",
              background: "#FFFFFF",
              surface: "#F7F9FC",
              text: {
                primary: "#2C3E50",
                secondary: "#34495E",
                muted: "#7F8C8D",
              },
              border: "#BDC3C7",
              hover: {
                primary: "#E74C3C",
                secondary: "#16A085",
              },
            }}
            title="Custom Colors"
            description="This component uses completely custom colors."
            className="large"
          />
        </div>

        {/* Different variants */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Component Variants
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BrandComponent
              colors={colors}
              title="Compact Variant"
              description="A more compact version of the component."
              className="compact"
            />

            <BrandComponent
              colors={colors}
              title="Large Variant"
              description="A larger, more prominent version."
              className="large"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandComponentExample;
