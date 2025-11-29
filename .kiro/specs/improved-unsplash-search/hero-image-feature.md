# Hero Image Feature

## Overview

The hero image feature uses the article title as a search query to find a dedicated background image that represents the entire article. This creates a more cohesive and visually striking presentation.

## Implementation

### API Route Changes

**New Field in ArticleData:**
```typescript
export interface ArticleData {
  id: string;
  title: string;
  content: string;
  heroImage: UnsplashImage | null;  // NEW: Dedicated hero image
  images: UnsplashImage[];           // Content images
  keywords: string[];
  themes: string[];
  createdAt: string;
}
```

**Hero Image Search:**
1. Title is generated or provided
2. Full title is used as search query: `searchImages(title, 1)`
3. First result becomes the hero image
4. If no result, falls back to first content image

**Example:**
- Title: "The Lonely Farmer"
- Hero Query: "The Lonely Farmer"
- Result: Image that captures the essence of a lonely farmer

### Article Page Changes

**Hero Image Display:**
- Uses `article.heroImage` if available
- Falls back to `article.images[0]` if no dedicated hero
- Displayed as full-width background with title overlay

**Content Images:**
- Separated from hero image
- `contentImages = article.heroImage ? article.images : article.images.slice(1)`
- Used for inline article images and gallery

**Image Count:**
- Displays total: `contentImages.length + (heroImage ? 1 : 0)`

## Benefits

1. **Better Visual Representation:** Title-based search finds images that represent the whole article theme
2. **More Specific:** Full sentence queries are more descriptive than keywords
3. **Cleaner Separation:** Hero image is distinct from content images
4. **Fallback Safe:** Still works if hero search fails

## Query Examples

| Title | Hero Query | Expected Result |
|-------|-----------|-----------------|
| "The Lonely Farmer" | "The Lonely Farmer" | Farmer in solitary setting |
| "Mountain Adventure Awaits" | "Mountain Adventure Awaits" | Dramatic mountain landscape |
| "Coffee and Morning Rituals" | "Coffee and Morning Rituals" | Coffee with morning ambiance |
| "The Digital Revolution" | "The Digital Revolution" | Technology/digital imagery |

## Flow Diagram

```
Article Generation
    ↓
Generate/Receive Title
    ↓
Search Unsplash: searchImages(title, 1)
    ↓
Hero Image Found? → Yes → Set as heroImage
    ↓                ↓
    No              Generate Content Images
    ↓                ↓
Use First Content   Combine Results
Image as Hero       ↓
    ↓              Return Article Data
    └──────────────┘
```

## User Experience

**Before:**
- First content image used as hero
- Less thematic coherence
- Hero might not represent article well

**After:**
- Dedicated hero image from title
- Strong visual representation of article theme
- Content images focus on specific paragraphs
- More professional, magazine-like layout
