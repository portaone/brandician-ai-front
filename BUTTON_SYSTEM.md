# Button System Documentation

## Overview

This document describes the new site-wide button system implemented in the Brandician AI frontend. The system provides consistent, reusable button components with global styling that can be easily modified from a single location.

## Global Button Styles

All button styles are defined in `src/index.css` using Tailwind's `@layer components` directive. The base button style includes:

```css
.btn {
  @apply inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  background: #FC5258;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.2);
  border-radius: 50px;
}
```

### Design Specifications
- **Background Color**: #FC5258 (red)
- **Box Shadow**: 0px 4px 24px rgba(0, 0, 0, 0.2)
- **Border Radius**: 50px (pill shape)
- **Hover Effect**: Darker red (#e6454b) with enhanced shadow
- **Focus Ring**: Red color for accessibility

## Button Component

The main button component is located at `src/components/common/Button.tsx`.

### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### Variants

1. **Primary** (default): Red background with white text
2. **Secondary**: White background with red text and border
3. **Ghost**: Transparent background with red text
4. **Outline**: Transparent background with red border and text

### Sizes

1. **sm**: Small buttons (px-3 py-1.5 text-sm)
2. **md**: Medium buttons (px-4 py-2 text-sm) - default
3. **lg**: Large buttons (px-6 py-3 text-base)
4. **xl**: Extra large buttons (px-8 py-4 text-lg)

## Usage Examples

### Basic Usage

```tsx
import Button from '../common/Button';

// Primary button (default)
<Button>Click me</Button>

// With variant
<Button variant="secondary">Secondary Button</Button>

// With size
<Button size="lg">Large Button</Button>
```

### With Icons

```tsx
import { Plus, ArrowRight } from 'lucide-react';

// Left icon
<Button leftIcon={<Plus className="h-5 w-5" />}>
  Create New Brand
</Button>

// Right icon
<Button rightIcon={<ArrowRight className="h-4 w-4" />}>
  Continue
</Button>

// Both icons
<Button 
  leftIcon={<Download className="h-4 w-4" />}
  rightIcon={<ArrowRight className="h-4 w-4" />}
>
  Download & Continue
</Button>
```

### Loading State

```tsx
<Button loading>Processing...</Button>
```

### Disabled State

```tsx
<Button disabled>Disabled Button</Button>
```

### Full Width

```tsx
<Button className="w-full">Full Width Button</Button>
```

## Migration Guide

### Before (Old Style)
```tsx
<button
  onClick={() => navigate('/brands/new')}
  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
>
  <Plus className="h-5 w-5 mr-2" />
  Create New Brand
</button>
```

### After (New Style)
```tsx
import Button from '../common/Button';

<Button
  onClick={() => navigate('/brands/new')}
  leftIcon={<Plus className="h-5 w-5" />}
>
  Create New Brand
</Button>
```

## Components Already Updated

The following components have been updated to use the new Button system:

1. **BrandList.tsx** - Create New Brand buttons and Continue buttons
2. **CreateBrand.tsx** - Back button and form submit button
3. **LandingPage.tsx** - CTA buttons
4. **QuestionnaireContainer.tsx** - Begin Questionnaire button
5. **PaymentContainer.tsx** - Copy to Clipboard and payment buttons

## Customization

To modify the global button styles, edit the CSS classes in `src/index.css`:

```css
@layer components {
  .btn {
    /* Base styles */
  }
  
  .btn-primary {
    /* Primary variant styles */
  }
  
  .btn-secondary {
    /* Secondary variant styles */
  }
  
  /* etc. */
}
```

## Benefits

1. **Consistency**: All buttons across the application have the same look and feel
2. **Maintainability**: Changes to button styling can be made in one place
3. **Accessibility**: Built-in focus states and proper ARIA attributes
4. **Flexibility**: Multiple variants and sizes for different use cases
5. **Developer Experience**: Simple, intuitive API with TypeScript support

## Testing

You can view all button variants and examples by adding the ButtonExamples component to your routes:

```tsx
import ButtonExamples from './components/examples/ButtonExamples';

// Add to your routes
<Route path="/button-examples" element={<ButtonExamples />} />
```

## Future Enhancements

Potential improvements to consider:

1. Add more variants (danger, success, warning)
2. Add button groups for related actions
3. Add dropdown button support
4. Add more size options
5. Add animation variants 