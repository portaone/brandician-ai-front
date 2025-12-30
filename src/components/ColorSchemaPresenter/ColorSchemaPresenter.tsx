import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useBrandStore } from "../../store/brand";
import { API_URL, brands } from "../../lib/api";
import { Loader } from "lucide-react";
import axios, { AxiosInstance } from "axios";

interface BrandColors {
  primary: string;
  supporting: string;
  background: string;
  accent: string;
  text: string;
}

const ColorSchemaPresenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { brandId } = useParams<{ brandId: string }>();
  const { currentBrand, selectBrand } = useBrandStore();
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Default brand colors - using black and white theme
  // Previous Figma theme (purple):
  // primary: '#7F5971',    // Main Color (dark purple)
  // supporting: '#E5D7CD', // Supporting Color (light beige)
  // background: '#F4F2F2', // Light Background Color
  // accent: '#FC5258',     // Accent color for CTA (coral red)
  // text: '#383236'        // Text color
  const [brandColors, setBrandColors] = useState<BrandColors>({
    primary: "#6B6B6B", // Main Color (medium grey)
    supporting: "#E0E0E0", // Supporting Color (light grey)
    background: "#F5F5F5", // Light Background Color (light gray)
    accent: "#000000", // Accent color for CTA (black)
    text: "#000000", // Text color (black)
  });

  const token = searchParams.get("token") ?? "";
  let guestApi: AxiosInstance | undefined;

  if (token) {
    guestApi = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  useEffect(() => {
    if (brandId && (!currentBrand || currentBrand.id !== brandId)) {
      selectBrand(brandId, guestApi);
    }
  }, [brandId, currentBrand, selectBrand]);

  // Load brand-specific colors from assets
  const loadBrandColors = async () => {
    if (currentBrand && brandId) {
      try {
        // First, produce/get the list of assets
        const response = await brands.listAssets(brandId, guestApi);
        console.log("Assets response:", response);
        console.log(
          "Available asset types:",
          response.assets.map((a: any) => a.type)
        );

        // Find color palette asset
        const colorAsset = response.assets.find(
          (asset: any) =>
            asset.type === "palette" ||
            asset.type === "color_palette" ||
            asset.type === "colors" ||
            asset.type.includes("color")
        );

        console.log("Found color asset:", colorAsset);

        if (colorAsset) {
          // Fetch the full color asset content
          const fullColorAsset = await brands.getAsset(
            brandId,
            colorAsset.id,
            guestApi
          );
          console.log("Full color asset:", fullColorAsset);

          if (fullColorAsset.content) {
            try {
              // Try to parse as JSON
              const colors = JSON.parse(fullColorAsset.content);
              console.log("Parsed colors:", colors);

              // Extract colors from the asset content
              setBrandColors({
                primary:
                  colors["main-color"] ||
                  colors.primary ||
                  colors.main ||
                  brandColors.primary,
                supporting:
                  colors["supporting-color"] ||
                  colors.supporting ||
                  colors.secondary ||
                  brandColors.supporting,
                background:
                  colors["background-color"] ||
                  colors.background ||
                  colors.neutral ||
                  "#F4F2F2",
                accent:
                  colors["accent-color"] ||
                  colors.accent ||
                  colors.cta ||
                  brandColors.accent,
                text:
                  colors["body-text-color"] ||
                  colors.text ||
                  colors.foreground ||
                  brandColors.text,
              });
              console.log("Setting brand colors to:", {
                primary: colors["main-color"],
                supporting: colors["supporting-color"],
                background: colors["background-color"] || "#F4F2F2",
                accent: colors["accent-color"],
                text: colors["body-text-color"],
              });
            } catch (parseError) {
              // If not JSON, try to parse as CSS or text format
              const lines = fullColorAsset.content.split("\n");
              const extractedColors: any = {};

              lines.forEach((line: string) => {
                // Match patterns like "primary: #XXXXXX" or "--primary: #XXXXXX"
                const colorMatch = line.match(
                  /(primary|main|brand|supporting|secondary|background|accent|cta|action|text|foreground)[:\s]+#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/i
                );
                if (colorMatch) {
                  const key = colorMatch[1].toLowerCase();
                  const value = `#${colorMatch[2]}`;
                  extractedColors[key] = value;
                }
              });

              setBrandColors({
                primary:
                  extractedColors.primary ||
                  extractedColors.main ||
                  extractedColors.brand ||
                  brandColors.primary,
                supporting:
                  extractedColors.supporting ||
                  extractedColors.secondary ||
                  brandColors.supporting,
                background:
                  extractedColors.background || brandColors.background,
                accent:
                  extractedColors.accent ||
                  extractedColors.cta ||
                  extractedColors.action ||
                  brandColors.accent,
                text:
                  extractedColors.text ||
                  extractedColors.foreground ||
                  brandColors.text,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load brand colors from assets:", error);
        // Fall back to localStorage if available
        const storedColors = localStorage.getItem(`brand_colors_${brandId}`);
        if (storedColors) {
          try {
            const colors = JSON.parse(storedColors);
            setBrandColors({
              primary: colors.primary || brandColors.primary,
              supporting: colors.supporting || brandColors.supporting,
              background: colors.background || brandColors.background,
              accent: colors.accent || brandColors.accent,
              text: colors.text || brandColors.text,
            });
          } catch (parseError) {
            console.error("Failed to parse stored colors:", parseError);
          }
        }
      } finally {
        setIsLoadingStatus(false);
      }
    }
  };

  useEffect(() => {
    loadBrandColors();
  }, [currentBrand, brandId]);

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-primary-600" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-white"
      style={{ minHeight: "1024px" }}
    >
      {/* Import Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Sans+Pro:wght@300;400;700&display=swap');
        header:first-child { display: none !important; }
        footer:last-child { display: none !important; }
        body { margin: 0; padding: 0; }
      `}</style>

      {/* Container with max width */}
      <div
        className="relative mx-auto"
        style={{ width: "1440px", height: "1024px" }}
      >
        {/* Right Gray Background */}
        <div
          className="absolute"
          style={{
            width: "720px",
            height: "1034px",
            left: "720px",
            top: "0px",
            background: "#F4F2F2",
          }}
        />

        {/* Header Content */}
        <div className="absolute" style={{ width: "100%", top: "41px" }}>
          {/* Logo Circle */}
          <div
            className="absolute rounded-full flex items-center justify-center overflow-hidden"
            style={{
              width: "64px",
              height: "64px",
              left: "93px",
              background: brandColors.primary,
              padding: "6px",
            }}
          >
            <img
              src="/images/brandician-icon.svg"
              alt="Brandician Logo"
              style={{
                width: "130%",
                height: "130%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Brand name text */}
          <div
            className="absolute"
            style={{
              left: "171px",
              top: "13px",
              fontFamily: "Bitter, serif",
              fontWeight: 400,
              fontSize: "32px",
              lineHeight: "38px",
              color: "#231F20",
            }}
          >
            {currentBrand?.name || "Brand Name"}
          </div>

          {/* Navigation */}
          <div
            className="absolute"
            style={{
              right: "59px",
              top: "22px",
              fontFamily: "Source Sans Pro, sans-serif",
              fontWeight: 400,
              fontSize: "18px",
              lineHeight: "18px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#231F20",
            }}
          >
            About | Our work | Team | Blog | Contact
          </div>
        </div>

        {/* Main Content - Left Side */}
        <div className="absolute" style={{ left: "97px" }}>
          {/* Title */}
          <h1
            style={{
              position: "absolute",
              width: "518px",
              top: "229px",
              fontFamily: "Bitter, serif",
              fontWeight: 400,
              fontSize: "64px",
              lineHeight: "77px",
              color: "#383236",
              margin: 0,
            }}
          >
            This is the Title
          </h1>

          {/* Subtitle */}
          <p
            style={{
              position: "absolute",
              width: "518px",
              top: "316px",
              fontFamily: "Bitter, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "28px",
              lineHeight: "40px",
              color: "#383236",
              margin: 0,
            }}
          >
            Subtitle: supports the title with
            <br />
            additional detail or mood.
          </p>

          {/* CTA Button */}
          <button
            className="absolute"
            style={{
              width: "214px",
              height: "50px",
              top: "420px",
              background: brandColors.accent,
              boxShadow: "0px 4px 24px rgba(0, 0, 0, 0.2)",
              borderRadius: "50px",
              border: "none",
              fontFamily: "Source Sans Pro, sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              lineHeight: "36px",
              textAlign: "center",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            ACCENT - CTA
          </button>

          {/* Heading */}
          <h2
            style={{
              position: "absolute",
              width: "518px",
              top: "598px",
              left: "-4px",
              fontFamily: "Bitter, serif",
              fontWeight: 600,
              fontSize: "32px",
              lineHeight: "38px",
              color: "#383236",
              margin: 0,
            }}
          >
            This is a Heading
          </h2>

          {/* Body Text */}
          <div
            style={{
              position: "absolute",
              width: "518px",
              top: "651px",
              left: "-4px",
              fontFamily: "Bitter, serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#383236",
            }}
          >
            <p
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                lineHeight: "24px",
              }}
            >
              This is the Body / Paragraph Text, used for presenting the main
              content of your brand — articles, service descriptions, blog
              posts, product info, and more. This text should feel easy on the
              eyes, with clear hierarchy and enough spacing to invite longer
              reading.
            </p>
            <p style={{ margin: 0, fontSize: "16px", lineHeight: "24px" }}>
              It's designed for clarity and flow — so the message is not just
              seen, but understood. Whether your tone is conversational or
              formal, this is where your voice truly lives.
            </p>
          </div>
        </div>

        {/* Color Circles - Right Side */}
        {/* Outer Circle - Supporting Color */}
        <div
          className="absolute rounded-full"
          style={{
            width: "578px",
            height: "579px",
            left: "791px",
            top: "238px",
            background: brandColors.supporting,
          }}
        />

        {/* Inner Circle - Main Color */}
        <div
          className="absolute rounded-full flex flex-col items-center justify-center"
          style={{
            width: "404px",
            height: "405px",
            left: "878px",
            top: "325px",
            background: brandColors.primary,
          }}
        >
          {/* Logo - 75% of the circle size (303px) */}
          <img
            src="/images/brandician-icon.svg"
            alt="Brandician Logo"
            style={{
              width: "303px",
              height: "303px",
              objectFit: "contain",
              marginBottom: "-80px", // Adjust to center with text below
            }}
          />

          {/* Main Color Text */}
          <div
            style={{
              fontFamily: "Bitter, serif",
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: "29px",
              textAlign: "center",
              color: "#FFFFFF",
              marginTop: "29px", // Move down by one line height
            }}
          >
            This is the
            <br />
            Main Color
          </div>
        </div>

        {/* Supporting Color Text */}
        <div
          className="absolute"
          style={{
            width: "204px",
            left: "978px",
            top: "734px",
            fontFamily: "Bitter, serif",
            fontWeight: 500,
            fontSize: "20px",
            lineHeight: "30px",
            textAlign: "center",
            color: "#2C3E58",
          }}
        >
          This is the
          <br />
          Supporting Color
        </div>

        {/* Background Color Text */}
        <div
          className="absolute"
          style={{
            width: "254px",
            left: "953px",
            top: "833px",
            fontFamily: "Bitter, serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "24px",
            textAlign: "center",
            color: "#9CA3AE",
          }}
        >
          This is the Light Background Color
          <br />
          for Alternating Sections
        </div>

        {/* Footer */}
        <div
          className="absolute"
          style={{
            left: "93px",
            top: "918px",
            fontFamily: "Source Sans Pro, sans-serif",
            fontWeight: 300,
            fontSize: "14px",
            lineHeight: "28px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#231F20",
          }}
        >
          {(currentBrand?.name || "BRAND NAME").toUpperCase()} — BRAND SCHEME
        </div>
      </div>
    </div>
  );
};

export default ColorSchemaPresenter;
