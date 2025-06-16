import { useMemo } from 'react';
import { BrandColors } from '../components/common/BrandComponent';

// Predefined brand color schemes
export const brandColorSchemes: Record<string, BrandColors> = {
  default: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
    border: '#E5E7EB',
    hover: {
      primary: '#2563EB',
      secondary: '#475569',
    },
  },
  luxury: {
    primary: '#8B5CF6',
    secondary: '#6366F1',
    accent: '#F59E0B',
    background: '#FEFEFE',
    surface: '#F8FAFC',
    text: {
      primary: '#1F2937',
      secondary: '#4B5563',
      muted: '#9CA3AF',
    },
    border: '#E5E7EB',
    hover: {
      primary: '#7C3AED',
      secondary: '#4F46E5',
    },
  },
  nature: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F0FDF4',
    text: {
      primary: '#064E3B',
      secondary: '#047857',
      muted: '#6B7280',
    },
    border: '#D1FAE5',
    hover: {
      primary: '#059669',
      secondary: '#047857',
    },
  },
  tech: {
    primary: '#0EA5E9',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F1F5F9',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
    },
    border: '#CBD5E1',
    hover: {
      primary: '#0284C7',
      secondary: '#475569',
    },
  },
  warm: {
    primary: '#EF4444',
    secondary: '#F97316',
    accent: '#FCD34D',
    background: '#FFFFFF',
    surface: '#FEF2F2',
    text: {
      primary: '#7F1D1D',
      secondary: '#B91C1C',
      muted: '#9CA3AF',
    },
    border: '#FECACA',
    hover: {
      primary: '#DC2626',
      secondary: '#EA580C',
    },
  },
};

interface UseBrandColorsOptions {
  brandName?: string;
  customColors?: Partial<BrandColors>;
  archetype?: string;
}

export const useBrandColors = ({
  brandName,
  customColors,
  archetype,
}: UseBrandColorsOptions = {}) => {
  return useMemo(() => {
    // Start with default colors
    let baseColors = brandColorSchemes.default;

    // Apply archetype-based colors if available
    if (archetype && brandColorSchemes[archetype.toLowerCase()]) {
      baseColors = brandColorSchemes[archetype.toLowerCase()];
    }

    // Apply brand-specific colors if available
    if (brandName && brandColorSchemes[brandName.toLowerCase()]) {
      baseColors = brandColorSchemes[brandName.toLowerCase()];
    }

    // Apply custom color overrides
    if (customColors) {
      return {
        ...baseColors,
        ...customColors,
        text: {
          ...baseColors.text,
          ...customColors.text,
        },
        hover: {
          ...baseColors.hover,
          ...customColors.hover,
        },
      };
    }

    return baseColors;
  }, [brandName, customColors, archetype]);
};

// Utility function to generate colors from a primary color
export const generateBrandColorsFromPrimary = (primaryColor: string): BrandColors => {
  // This is a simplified version - you might want to use a color manipulation library
  // like 'color2k' or 'chroma-js' for more sophisticated color generation
  
  return {
    primary: primaryColor,
    secondary: '#64748B', // You could derive this from primary
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      muted: '#9CA3AF',
    },
    border: '#E5E7EB',
    hover: {
      primary: primaryColor, // You could darken this
      secondary: '#475569',
    },
  };
};

// Extract colors from brand data if available
export const extractBrandColors = (brand: any): Partial<BrandColors> | undefined => {
  if (!brand) return undefined;

  // If brand has color data stored
  if (brand.colors) {
    return brand.colors;
  }

  // If brand has archetype, use archetype-based colors
  if (brand.archetype) {
    const archetypeColors = brandColorSchemes[brand.archetype.toLowerCase()];
    if (archetypeColors) {
      return archetypeColors;
    }
  }

  return undefined;
};