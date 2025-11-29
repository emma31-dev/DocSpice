# Smart Image Selection

## Problem

Unsplash's first search result isn't always the best choice:
- First result is often too generic or popular
- May not have ideal aspect ratio for hero images
- Could have poor resolution or missing descriptions
- 2nd and 3rd results often more unique and relevant

## Solution

Implement intelligent image selection that:
1. Fetches multiple results (5 instead of 1)
2. Scores each image based on quality metrics
3. Selects the best image, preferring 2nd/3rd results

## Scoring Algorithm

### 1. Aspect Ratio Score (30 points max)
**For Hero Images:**
- **30 points:** 1.5 - 2.5 ratio (ideal landscape)
- **20 points:** 1.2 - 1.5 ratio (acceptable landscape)
- **10 points:** > 2.5 ratio (too wide)
- **5 points:** < 1.2 ratio (portrait/square)

**Why:** Hero images need landscape orientation for full-width display

### 2. Resolution Score (25 points max)
- **25 points:** 2MP+ (2000000+ pixels)
- **15 points:** 1MP+ (1000000+ pixels)
- **5 points:** < 1MP

**Why:** Higher resolution ensures crisp display on all devices

### 3. Description Quality Score (20 points max)
- **20 points:** > 50 characters (detailed)
- **10 points:** > 20 characters (some description)
- **5 points:** > 0 characters (minimal)
- **0 points:** No description

**Why:** Better descriptions indicate curated, quality images

### 4. Position Bonus (15 points max)
- **15 points:** Preferred position (default: index 1 = 2nd result)
- **10 points:** Adjacent to preferred (1st or 3rd result)
- **5 points:** First result
- **0 points:** Other positions

**Why:** 2nd and 3rd results often more unique than 1st

## Total Score Range: 0-90 points

## Implementation

### New Functions

**`selectBestImage(images, preferredIndex)`**
- Scores all images
- Returns highest scoring image
- Logs scores for debugging

**`searchBestHeroImage(query)`**
- Fetches 5 results
- Uses `selectBestImage` with preferredIndex=1 (2nd result)
- Returns best hero image

### Updated Functions

**`searchImagesForQueries(queries)`**
- Now fetches 5 results per query (up from 3)
- Uses `selectBestImage` for each query
- Falls back to alternatives if best is duplicate

## Examples

### Example 1: Hero Image Selection

**Query:** "The Lonely Farmer"

**Results:**
```
Image 1: 1920x1080, ratio 1.78, description: "farmer", score: 60
Image 2: 2400x1350, ratio 1.78, detailed desc, score: 85 ← SELECTED
Image 3: 1600x1200, ratio 1.33, no desc, score: 45
Image 4: 3000x2000, ratio 1.50, good desc, score: 75
Image 5: 1280x720, ratio 1.78, minimal desc, score: 55
```

**Selected:** Image 2 (highest score)

### Example 2: Content Image Selection

**Query:** "mountain hiking"

**Results:**
```
Image 1: 1920x1280, ratio 1.50, score: 70
Image 2: 2560x1440, ratio 1.78, score: 80 ← SELECTED
Image 3: 1600x1600, ratio 1.00, score: 40
```

**Selected:** Image 2 (best landscape ratio + resolution)

## Benefits

1. **Better Quality:** Selects images with ideal specs
2. **More Unique:** Avoids overly popular first results
3. **Consistent Layout:** Prefers landscape ratios for hero
4. **Higher Resolution:** Prioritizes crisp, clear images
5. **Curated Content:** Values images with descriptions

## Configuration

**Preferred Index:** Default is 1 (2nd result)
- Can be adjusted per use case
- Hero images: prefer 2nd result
- Content images: prefer 2nd result
- Gallery images: could prefer 3rd result for variety

## Performance Impact

**Before:**
- 1 image per query
- No quality filtering
- First result always used

**After:**
- 5 images per query (same API call cost)
- Smart quality filtering
- Best result selected

**API Calls:** Same (1 call per query, just higher per_page)
**Processing:** Minimal (simple scoring algorithm)
**Result:** Significantly better image quality

## Logging

The system logs detailed scoring information:
```
Image selection scores: [
  { index: 1, score: 85, aspectRatio: '1.78', resolution: '2400x1350', hasDescription: true },
  { index: 3, score: 75, aspectRatio: '1.50', resolution: '3000x2000', hasDescription: true },
  { index: 0, score: 60, aspectRatio: '1.78', resolution: '1920x1080', hasDescription: true },
  ...
]
```

This helps debug and tune the scoring algorithm.
