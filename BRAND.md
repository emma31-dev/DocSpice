# DocSpice Brand Assets

## Brand Colors

### Primary Gradient
- Blue: `#3B82F6` (rgb(59, 130, 246))
- Purple: `#8B5CF6` (rgb(139, 92, 246))

### Accent Colors
- Yellow/Amber: `#F59E0B` (rgb(245, 158, 11))
- Red: `#EF4444` (rgb(239, 68, 68))  
- Green: `#10B981` (rgb(16, 185, 129))

### Neutral Colors
- Gray 50: `#F9FAFB`
- Gray 600: `#4B5563`
- Gray 800: `#1F2937`

## Typography

### Primary Font
- Geist Sans (variable font)
- Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif

### Logo Text
- Font Weight: Bold (700)
- Gradient: Linear from Blue to Purple
- Text Clip: Background clip to text

## Logo Usage

### DocSpice Icon
- SVG format for scalability
- Combines document symbol with colorful "spice" dots
- Used in favicons, headers, and branding

### Color Variations
- **Full Color**: Primary gradient with accent dots
- **Monochrome**: Single color for simple contexts
- **White**: For dark backgrounds

## Component Usage

```tsx
import { DocSpiceIcon, DocSpiceLogo } from '@/components/DocSpiceIcon';

// Icon only
<DocSpiceIcon size={24} className="text-blue-600" />

// Full logo with text
<DocSpiceLogo size={32} className="mb-4" />
```

## Brand Voice

- **Friendly & Approachable**: "Transform your text into beautiful stories"
- **Professional**: Focus on quality and AI-powered features
- **Creative**: Emphasis on visual enhancement and storytelling
- **Simple**: No-friction, easy-to-use experience

## File Formats

### Icons
- `docspice-logo.svg` - Full logo
- `favicon.svg` - Simplified favicon version

### Usage Guidelines
- Minimum size: 16px for icons
- Always maintain aspect ratio
- Use gradient versions on light backgrounds
- Use solid colors for small sizes (under 24px)