# IlliniHunt Style Guide & Design System

This document serves as the comprehensive design system reference for IlliniHunt development. Follow these guidelines to maintain visual consistency and brand compliance.

## Brand Colors

### Primary Colors
```css
/* UIUC Orange - Primary brand color */
--uiuc-orange: #FF6B35
/* Usage: Primary CTAs, highlights, accent elements */
/* Tailwind: bg-uiuc-orange, text-uiuc-orange, border-uiuc-orange */

/* UIUC Blue - Secondary brand color */
--uiuc-blue: #13294B  
/* Usage: Headers, navigation, secondary elements */
/* Tailwind: bg-uiuc-blue, text-uiuc-blue, border-uiuc-blue */
```

### Supporting Colors
```css
/* UIUC Light Orange - Accent color */
--uiuc-light-orange: #FFB577
/* Usage: Hover states, light backgrounds, subtle accents */
/* Tailwind: bg-uiuc-light-orange, text-uiuc-light-orange */

/* UIUC Light Blue - Complementary color */
--uiuc-light-blue: #4B7BA8
/* Usage: Secondary elements, muted states */
/* Tailwind: bg-uiuc-light-blue, text-uiuc-light-blue */
```

### shadcn/ui Integration
```css
/* Primary system color mapped to UIUC Orange */
primary: {
  DEFAULT: "#FF6B35", // UIUC Orange
  foreground: "hsl(var(--primary-foreground))",
}

/* Secondary system color mapped to UIUC Blue */
secondary: {
  DEFAULT: "#13294B", // UIUC Blue  
  foreground: "hsl(var(--secondary-foreground))",
}

/* Accent color mapped to UIUC Light Orange */
accent: {
  DEFAULT: "#FFB577", // UIUC Light Orange
  foreground: "hsl(var(--accent-foreground))",
}
```

## Typography Scale

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: sans-serif
- **Implementation**: `font-['Inter',sans-serif]`

### Heading Hierarchy
```css
/* H1 - Main Page Titles */
.h1 { @apply text-4xl font-bold text-uiuc-blue; }
/* Usage: Page titles, hero headings */

/* H2 - Section Headings */  
.h2 { @apply text-3xl font-semibold text-uiuc-blue; }
/* Usage: Major section titles */

/* H3 - Subsection Titles */
.h3 { @apply text-2xl font-semibold text-gray-900; }
/* Usage: Card titles, subsection headers */

/* H4 - Component Titles */
.h4 { @apply text-xl font-medium text-gray-900; }
/* Usage: Card headers, form sections */
```

### Body Text
```css
/* Large Body - Important content */
.text-large { @apply text-lg text-gray-700; }

/* Standard Body - General content */
.text-body { @apply text-base text-gray-600; }

/* Small Body - Metadata, captions */
.text-small { @apply text-sm text-gray-500; }

/* Caption - Form labels, tiny text */
.text-caption { @apply text-xs text-gray-400 uppercase tracking-wide; }
```

## Component Patterns

### Button Variants
```tsx
// Primary CTA - UIUC Orange background
<Button variant="default">Primary Action</Button>

// Secondary - UIUC Blue background  
<Button variant="secondary">Secondary Action</Button>

// Outline - Border with no fill
<Button variant="outline">Less Important</Button>

// Ghost - Minimal styling
<Button variant="ghost">Subtle Action</Button>

// Destructive - Red for dangerous actions
<Button variant="destructive">Delete</Button>
```

### Form Elements
```tsx
// Standard input with proper labeling
<div>
  <label className="text-sm font-medium text-gray-700 mb-2 block">
    Field Label
  </label>
  <Input placeholder="Enter text..." />
</div>

// Textarea for longer content
<Textarea placeholder="Description..." rows={4} />

// Select dropdown
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose option..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Card Components
```tsx
// Standard card layout
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card body content */}
  </CardContent>
</Card>
```

### Badge Variants
```tsx
// Default badge
<Badge variant="default">Status</Badge>

// Custom UIUC colors
<Badge className="bg-uiuc-orange hover:bg-uiuc-orange/90">Orange</Badge>
<Badge className="bg-uiuc-blue hover:bg-uiuc-blue/90">Blue</Badge>
```

## Layout Principles

### Container Widths
```css
/* Main content container - 1280px max */
.container-main { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; }

/* Reading content - 896px max */
.container-reading { @apply max-w-4xl mx-auto px-4; }

/* Form content - 448px max */
.container-form { @apply max-w-md mx-auto px-4; }
```

### Grid Systems
```css
/* Responsive card grids */
.grid-cards { @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6; }

/* Dashboard layouts */
.grid-dashboard { @apply grid grid-cols-1 lg:grid-cols-4 gap-6; }

/* Two column layout */
.grid-two-col { @apply grid grid-cols-1 lg:grid-cols-2 gap-8; }
```

### Spacing Scale
```css
/* Use Tailwind spacing scale consistently */
.spacing-xs { @apply p-1; }    /* 4px */
.spacing-sm { @apply p-2; }    /* 8px */
.spacing-md { @apply p-4; }    /* 16px */
.spacing-lg { @apply p-6; }    /* 24px */
.spacing-xl { @apply p-8; }    /* 32px */
.spacing-2xl { @apply p-12; }  /* 48px */
```

## Design Patterns

### Loading States
```tsx
// Spinner with UIUC Orange
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange" />

// Loading page layout
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-uiuc-orange mx-auto mb-4" />
    <p className="text-gray-600">Loading...</p>
  </div>
</div>
```

### Error States
```tsx
// Error message container
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
  <p className="font-semibold">Error Title</p>
  <p className="text-sm">Error description</p>
</div>
```

### Navigation Header
```tsx
// Transparent header with UIUC branding
<header className="absolute top-0 left-0 right-0 z-50 bg-transparent text-white">
  <div className="container mx-auto flex items-center justify-between p-4">
    <Link to="/" className="text-xl sm:text-2xl font-bold hover:text-uiuc-light-orange">
      IlliniHunt
    </Link>
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Navigation buttons */}
    </div>
  </div>
</header>
```

## Accessibility Guidelines

### Color Contrast
- **Minimum ratio**: 4.5:1 for normal text
- **Large text**: 3:1 minimum ratio
- **Test tools**: Use browser dev tools or online contrast checkers

### Interactive Elements
```tsx
// Proper focus states
<Button className="focus:outline-none focus:ring-2 focus:ring-uiuc-orange focus:ring-offset-2">
  Accessible Button
</Button>

// Proper labeling
<Input 
  id="email" 
  aria-label="Email address"
  aria-describedby="email-help"
/>
<p id="email-help" className="text-sm text-gray-500">
  We'll never share your email
</p>
```

### Semantic HTML
- Use proper heading hierarchy (h1 → h2 → h3)
- Include ARIA labels for complex interactions
- Ensure keyboard navigation works for all interactive elements

## Usage Rules

### ✅ Do
- Use UIUC Orange for primary CTAs and important highlights
- Maintain consistent spacing using the defined Tailwind scale
- Follow the typography hierarchy for content structure
- Use semantic HTML elements with proper ARIA labels
- Test components on mobile devices regularly
- Ensure 4.5:1 contrast ratio for all text
- Keep the UIUC brand colors as the primary palette

### ❌ Don't
- Mix custom colors with the established brand palette
- Use arbitrary spacing values outside the defined scale
- Override typography styles without design approval
- Stack multiple primary buttons in the same area
- Use color alone to convey important information
- Create new component variants without documentation
- Use non-Inter fonts without justification

## Responsive Design

### Breakpoints (Tailwind defaults)
```css
sm: 640px   /* Small screens and up */
md: 768px   /* Medium screens and up */
lg: 1024px  /* Large screens and up */
xl: 1280px  /* Extra large screens and up */
2xl: 1536px /* 2X large screens and up */
```

### Mobile-First Approach
```tsx
// Always design mobile-first, then enhance
<div className="text-sm sm:text-base lg:text-lg">
  Responsive text sizing
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid layout
</div>
```

### Window Resize Handling
The app uses a custom `useWindowSize` hook to force React re-renders on window resize, ensuring Tailwind responsive classes update properly during browser resizing.

## File Organization

### Component Structure
```
src/components/
├── auth/           # Authentication components
├── project/        # Project-related components  
└── ui/            # Reusable UI primitives (shadcn/ui)
```

### Styling Files
- `tailwind.config.js` - UIUC color definitions and theme extensions
- `src/index.css` - Global styles and CSS custom properties
- Component files - Use Tailwind classes, avoid custom CSS when possible

## Development Workflow

1. **Design Review**: Check this style guide before implementing new components
2. **Component Creation**: Use existing UI primitives from `src/components/ui/`
3. **Color Usage**: Stick to the defined UIUC color palette
4. **Spacing**: Use Tailwind spacing scale (p-4, m-6, gap-4, etc.)
5. **Typography**: Follow the established hierarchy
6. **Testing**: Verify responsive behavior and accessibility
7. **Documentation**: Update this guide when adding new patterns

This style guide ensures consistent, accessible, and brand-compliant UI development across the IlliniHunt platform.