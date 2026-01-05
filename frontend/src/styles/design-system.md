# Todo Application - Vibrant Dark Theme Design System

## Overview
This design system provides a comprehensive guide for the vibrant dark theme UI components, colors, typography, and interaction patterns for the todo application.

## Color Palette

### Primary Colors
- **Indigo**: #6366f1 (Primary accent)
- **Purple**: #8b5cf6 (Secondary accent)
- **Background Primary**: #0f172a (Dark blue-gray)
- **Background Secondary**: #1e293b (Slightly lighter blue-gray)
- **Background Tertiary**: #334155 (Medium blue-gray)

### Accent Colors
- **Blue**: #3b82f6
- **Green**: #10b981
- **Yellow**: #f59e0b
- **Red**: #ef4444
- **Pink**: #ec4899

### Gradients
- **Primary**: linear-gradient(135deg, #8b5cf6, #ec4899)
- **Secondary**: linear-gradient(135deg, #f59e0b, #f97316)
- **Tertiary**: linear-gradient(135deg, #3b82f6, #06b6d4)
- **Success**: linear-gradient(135deg, #10b981, #059669)
- **Warning**: linear-gradient(135deg, #f59e0b, #d97706)
- **Danger**: linear-gradient(135deg, #ef4444, #dc2626)
- **Info**: linear-gradient(135deg, #3b82f6, #2563eb)

## Typography

### Font Sizes
- **XS**: 0.75rem (12px)
- **SM**: 0.875rem (14px)
- **Base**: 1rem (16px)
- **LG**: 1.125rem (18px)
- **XL**: 1.25rem (20px)
- **2XL**: 1.5rem (24px)
- **3XL**: 1.875rem (30px)
- **4XL**: 2.25rem (36px)
- **5XL**: 3rem (48px)

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing Scale
- **XS**: 0.25rem (4px)
- **SM**: 0.5rem (8px)
- **MD**: 1rem (16px)
- **LG**: 1.5rem (24px)
- **XL**: 2rem (32px)
- **2XL**: 3rem (48px)
- **3XL**: 4rem (64px)

## Border Radius
- **SM**: 0.25rem (4px)
- **MD**: 0.5rem (8px)
- **LG**: 0.75rem (12px)
- **XL**: 1rem (16px)
- **2XL**: 1.5rem (24px)
- **Full**: 9999px

## Shadows
- **SM**: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- **MD**: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- **LG**: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
- **XL**: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
- **2XL**: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

## Component Specifications

### Button Variants
- **Primary**: Gradient background (indigo to purple), white text, hover effects
- **Secondary**: Gradient background (gray), white text
- **Success**: Gradient background (green to emerald), white text
- **Danger**: Gradient background (red), white text
- **Warning**: Gradient background (yellow to amber), white text
- **Outline**: Border with gradient hover effect

### Card Component
- Background: Dark slate with gradient top border
- Rounded corners with XL radius
- Hover effects with shadow and transform
- Gradient accent bar at top

### Input Fields
- Dark background with border
- Focus states with gradient ring
- Placeholder styling
- Error states with red border

### Metric Cards
- Gradient backgrounds by type
- Different accent colors for different metrics
- Hover animations
- Icon integration

### Navigation
- Gradient backgrounds
- Hover effects
- Active states

## Animations

### Fade In
- Duration: 0.5s
- Easing: ease-in-out
- Opacity transition from 0 to 1

### Slide Up
- Duration: 0.3s
- Easing: ease-out
- Transform from translateY(20px) to translateY(0)

### Pulse
- Duration: 3s
- Easing: cubic-bezier(0.4, 0, 0.6, 1)
- Infinite loop
- Opacity variation from 1 to 0.8

### Pulse Glow
- Duration: 2s
- Easing: ease-in-out
- Infinite loop
- Box-shadow glow effect

### Hover Effects
- Transform: translateY(-2px)
- Shadow enhancement
- Gradient transitions

## Responsive Breakpoints

### Mobile (Default)
- Single column layouts
- Full-width buttons
- Compact spacing

### Tablet (640px+)
- Two-column grids
- Medium spacing
- Adjusted typography

### Desktop (1024px+)
- Three-four column grids
- Larger spacing
- Full typography

### Large Desktop (1280px+)
- Four-six column grids
- Maximum spacing
- Full typography

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Sufficient contrast for readability
- Dark mode optimized

### Focus States
- Visible focus rings
- High contrast for keyboard navigation
- Clear visual indicators

### Interactive Elements
- Proper sizing for touch targets
- Clear hover and active states
- Smooth transitions

## Component Usage Examples

### Button
```jsx
<VibrantButton variant="primary" size="default">
  Click Me
</VibrantButton>
```

### Card
```jsx
<VibrantCard>
  <VibrantCardHeader>
    <VibrantCardTitle>Title</VibrantCardTitle>
    <VibrantCardDescription>Description</VibrantCardDescription>
  </VibrantCardHeader>
  <VibrantCardContent>
    Content
  </VibrantCardContent>
</VibrantCard>
```

### Input
```jsx
<VibrantInput
  label="Email"
  placeholder="Enter your email"
  error={hasError ? "Invalid email" : undefined}
/>
```

### Metric Card
```jsx
<VibrantMetricCard
  title="Total Tasks"
  value={totalTasks}
  icon={<CalendarIcon />}
  variant="total-tasks"
/>
```

This design system provides a consistent, vibrant, and accessible UI for the todo application with a dark theme focus.