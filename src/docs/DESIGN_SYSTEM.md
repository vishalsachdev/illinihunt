# IlliniHunt Design System

## Core Principles
1.  **Premium Dark Mode ("Midnight")**: The application defaults to a deep navy background (`bg-midnight`) to create a premium, immersive feel.
2.  **Glassmorphism**: Use `glass-card` and `glass` utilities for containers to add depth and texture.
3.  **Vibrant Accents**: Use `uiuc-orange` and neon accents (`text-neon-blue`, `text-neon-purple`) to highlight interactive elements.
4.  **Typography**: Use `Inter` for clean, modern readability. Headings should be bold and tracking-tight.

## Colors

### Backgrounds
-   **Main Background**: `bg-midnight` (#050A14)
-   **Card Background**: `glass-card` (bg-card/50 backdrop-blur-sm) or `bg-midnight-800`
-   **Hover State**: `hover:bg-white/5`

### Text
-   **Primary Text**: `text-foreground` (White/Off-white)
-   **Secondary Text**: `text-muted-foreground` (Light Gray)
-   **Accent Text**: `text-uiuc-orange`

### Borders
-   **Default Border**: `border-white/10` or `border-border/50`

## Component Guidelines

### Cards
Always use the `glass-card` utility or a transparent background with a subtle border. Avoid solid white backgrounds.

```tsx
<div className="glass-card rounded-xl p-6">
  <h3 className="text-lg font-semibold text-foreground mb-4">Title</h3>
  <p className="text-muted-foreground">Content goes here...</p>
</div>
```

### Buttons
-   **Primary**: `bg-uiuc-orange hover:bg-uiuc-orange/90 text-white`
-   **Secondary/Outline**: `border-white/10 hover:bg-white/5 text-foreground`
-   **Ghost**: `hover:bg-white/5 text-muted-foreground hover:text-foreground`

### Images
Wrap images in a container with `rounded-xl` and `overflow-hidden`. Consider adding a subtle gradient overlay or hover zoom effect.

```tsx
<div className="group relative rounded-xl overflow-hidden border border-white/10">
  <img src="..." className="transition-transform duration-500 group-hover:scale-105" />
</div>
```
49: 
50: ### Badges / Categories
51: -   **Text**: Always use `text-foreground` (White) for readability.
52: -   **Background**: Use the category color with low opacity (e.g., `backgroundColor: ${color}20`).
53: -   **Border**: Use the category color with medium opacity (e.g., `borderColor: ${color}40`).
54: -   **Icon**: Use the full category color.
55: 
56: ```tsx
57: <Badge 
58:   variant="secondary" 
59:   className="text-foreground"
60:   style={{ 
61:     backgroundColor: `${color}20`,
62:     borderColor: `${color}40`
63:   }}
64: >
65:   <span style={{ color: color }}>{icon}</span>
66:   {name}
67: </Badge>
68: ```

## Page Layout
1.  **Container**: `min-h-screen bg-midnight text-foreground dark` (Add `dark` class to force dark mode variables)
2.  **Content Wrapper**: `container mx-auto px-4`
3.  **Spacing**: Use generous padding/margin (e.g., `py-12`, `gap-8`).

## Do's and Don'ts
-   **DO** use `text-foreground` and `text-muted-foreground` for text colors.
-   **DO** use `border-white/10` for subtle dividers.
-   **DON'T** use `bg-white` for containers.
-   **DON'T** use `text-gray-900` or `text-black` unless on a specifically light background (which should be rare).
