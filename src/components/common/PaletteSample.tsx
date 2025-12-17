import React from "react";
import { useBrandStore } from "../../store/brand";
import { useParams } from "react-router-dom";

interface PaletteSampleProps {
  content: string;
  brandId?: string;
}

/**
 * PaletteSample component for 'palette' asset type
 * Shows scaled-down color schema presenter with clickable preview
 */
const PaletteSample: React.FC<PaletteSampleProps> = ({ content, brandId }) => {
  const { currentBrand } = useBrandStore();
  const params = useParams();

  let colors: { [key: string]: string } = {};
  try {
    colors = JSON.parse(content);
  } catch (e) {
    return <div className="text-red-500">Invalid palette data</div>;
  }

  const primary = colors["main-color"] || "#2c3e50";
  const supporting = colors["supporting-color"] || "#e5d7cd";
  const accent = colors["accent-color"] || "#f76c6c";
  const text = colors["body-text-color"] || "#444";
  const background = colors["background-color"] || "#F4F2F2";

  const handleOpenColorSchema = () => {
    const targetBrandId = brandId || currentBrand?.id || params?.brandId;

    if (targetBrandId) {
      window.open(`/brands/${targetBrandId}/color-schema`, "_blank");
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  // Scale factor for the preview (50% of original)
  const scale = 0.5;
  const width = 1440 * scale; // 720px
  const height = 1024 * scale; // 512px

  return (
    <>
      {/* Clickable thumbnail of full color schema presenter */}
      <div
        onClick={handleOpenColorSchema}
        style={{
          cursor: "pointer",
          display: "inline-block",
          position: "relative",
          transition: "transform 0.2s, box-shadow 0.2s",
          marginBottom: 24,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }}
      >
        <div
          className="hidden lg:block"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            position: "relative",
            overflow: "hidden",
            background: "white",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Right gray background */}
          <div
            style={{
              position: "absolute",
              width: `${720 * scale}px`,
              height: `${1034 * scale}px`,
              left: `${720 * scale}px`,
              top: 0,
              background: background,
            }}
          />

          {/* Header - Logo */}
          <div
            style={{
              position: "absolute",
              width: `${64 * scale}px`,
              height: `${64 * scale}px`,
              left: `${93 * scale}px`,
              top: `${41 * scale}px`,
              borderRadius: "50%",
              background: primary,
            }}
          />

          {/* Brand name */}
          <div
            style={{
              position: "absolute",
              left: `${171 * scale}px`,
              top: `${54 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${32 * scale}px`,
              color: "#231F20",
              fontWeight: 400,
            }}
          >
            {currentBrand?.name || "Brand"}
          </div>

          {/* Title */}
          <div
            style={{
              position: "absolute",
              width: `${518 * scale}px`,
              left: `${97 * scale}px`,
              top: `${229 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${64 * scale}px`,
              lineHeight: `${77 * scale}px`,
              color: "#383236",
              fontWeight: 400,
            }}
          >
            This is the Title
          </div>

          {/* Subtitle */}
          <div
            style={{
              position: "absolute",
              width: `${518 * scale}px`,
              left: `${97 * scale}px`,
              top: `${316 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${28 * scale}px`,
              lineHeight: `${40 * scale}px`,
              color: "#383236",
              fontStyle: "italic",
            }}
          >
            Subtitle: supports the title
          </div>

          {/* CTA Button */}
          <div
            style={{
              position: "absolute",
              width: `${214 * scale}px`,
              height: `${50 * scale}px`,
              left: `${97 * scale}px`,
              top: `${420 * scale}px`,
              background: accent,
              borderRadius: `${50 * scale}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: `${18 * scale}px`,
              fontFamily: "Source Sans Pro, sans-serif",
              fontWeight: 700,
            }}
          >
            ACCENT
          </div>

          {/* Heading */}
          <div
            style={{
              position: "absolute",
              width: `${518 * scale}px`,
              left: `${93 * scale}px`,
              top: `${598 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${32 * scale}px`,
              color: "#383236",
              fontWeight: 600,
            }}
          >
            This is a Heading
          </div>

          {/* Body text */}
          <div
            style={{
              position: "absolute",
              width: `${518 * scale}px`,
              left: `${93 * scale}px`,
              top: `${651 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${16 * scale}px`,
              lineHeight: `${24 * scale}px`,
              color: "#383236",
            }}
          >
            This is the Body Text...
          </div>

          {/* Outer circle - supporting color */}
          <div
            style={{
              position: "absolute",
              width: `${578 * scale}px`,
              height: `${579 * scale}px`,
              left: `${791 * scale}px`,
              top: `${238 * scale}px`,
              borderRadius: "50%",
              background: supporting,
            }}
          />

          {/* Inner circle - main color */}
          <div
            style={{
              position: "absolute",
              width: `${404 * scale}px`,
              height: `${405 * scale}px`,
              left: `${878 * scale}px`,
              top: `${325 * scale}px`,
              borderRadius: "50%",
              background: primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Bitter, serif",
                fontSize: `${24 * scale}px`,
                color: "white",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Main
              <br />
              Color
            </div>
          </div>

          {/* Supporting color text */}
          <div
            style={{
              position: "absolute",
              left: `${978 * scale}px`,
              top: `${734 * scale}px`,
              fontFamily: "Bitter, serif",
              fontSize: `${20 * scale}px`,
              color: "#2C3E58",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            Supporting Color
          </div>
        </div>
        <div
          className="text-sm lg:text-xs"
          style={{
            marginTop: 8,
            textAlign: "center",
            color: "#666",
            fontWeight: 500,
          }}
        >
          Click to view full color schema presenter in new window
        </div>
      </div>

      {/* Color list with copy buttons */}
      <div style={{ marginTop: 24, paddingLeft: 8, paddingRight: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Palette Colors
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5em" }}>
          {Object.entries(colors).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
                minWidth: 220,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: value,
                  border: "1px solid #e5e7eb",
                  marginRight: 10,
                }}
              />
              <span style={{ fontWeight: 500, minWidth: 110 }}>
                {key.replace(/-/g, " ")}:
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  marginLeft: 6,
                  marginRight: 8,
                }}
              >
                {value}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(value);
                }}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  padding: "2px 10px",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#333",
                  marginLeft: 2,
                }}
                title={`Copy ${value} to clipboard`}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PaletteSample;
