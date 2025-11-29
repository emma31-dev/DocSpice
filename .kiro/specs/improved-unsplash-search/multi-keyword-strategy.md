# Multi-Keyword Search Strategy

## Overview

The multi-keyword search approach generates diverse, specific image search queries by combining keywords, themes, entities, and visual descriptors in strategic ways. This ensures better image relevance and variety.

## 8 Search Strategies

### Strategy 1: Two-Keyword Combinations
**Pattern:** `keyword1 + keyword2`
**Example:** "mountain forest", "coffee morning"
**Purpose:** Creates natural, specific queries from top keywords

### Strategy 2: Keyword + Theme
**Pattern:** `keyword + theme`
**Example:** "sunset nature", "laptop technology"
**Purpose:** Adds thematic context to keywords for better relevance

### Strategy 3: Keyword + Visual Descriptor
**Pattern:** `descriptor + keyword`
**Example:** "vibrant flowers", "peaceful lake", "modern office"
**Purpose:** Adds visual qualities (color, mood, setting, lighting) to keywords

### Strategy 4: Three-Keyword Combinations
**Pattern:** `keyword1 + keyword2 + keyword3`
**Example:** "mountain hiking adventure"
**Purpose:** Creates highly specific queries for unique images

### Strategy 5: Entity + Keyword (Person-Aware)
**Pattern (Person):** `portrait descriptor + keyword`
**Pattern (Other):** `entity + keyword`
**Example (Person):** "portrait man peaceful" (for name "Larry")
**Example (Other):** "Paris architecture"
**Purpose:** Handles person names specially to get portrait images

### Strategy 6: Theme + Visual Descriptor
**Pattern:** `descriptor + theme`
**Example:** "vibrant nature", "calm technology"
**Purpose:** Adds visual richness to thematic queries

### Strategy 7: Keyword + Setting + Lighting
**Pattern:** `keyword + setting + lighting`
**Example:** "forest natural sunset", "office minimal soft light"
**Purpose:** Creates maximum specificity with environmental context

### Strategy 8: Entity + Theme + Descriptor
**Pattern (Person):** `portrait descriptor + theme`
**Pattern (Other):** `entity + theme + descriptor`
**Example (Person):** "portrait woman peaceful" (for person in peaceful context)
**Example (Other):** "Paris architecture dramatic"
**Purpose:** Rich contextual queries combining all analysis elements

## Person Entity Special Handling

When a person name like "Larry" is detected:

1. **Entity Detection:** Name is recognized as a person entity
2. **Query Transformation:** Instead of searching "Larry", generates:
   - "portrait man"
   - "portrait woman"
   - "person portrait"
   - "man portrait peaceful" (with context)
3. **Context Integration:** Combines portrait descriptors with themes/keywords from text
4. **Result:** Images of actual people that match the article's mood and context

## Query Flow

```
Text Analysis
    ↓
Extract: Keywords, Themes, Entities
    ↓
Generate Multi-Keyword Queries (8 strategies)
    ↓
Add Strategy-Specific Queries (Narrative/Technical/Descriptive)
    ↓
Filter Generic Terms
    ↓
Enhance Remaining Queries
    ↓
Deduplicate
    ↓
Calculate Relevance Scores
    ↓
Sort by Score & Specificity
    ↓
Return Top 6-10 Queries
```

## Benefits

1. **Diversity:** Multiple strategies ensure varied image types
2. **Specificity:** Multi-word queries are more precise than single keywords
3. **Context-Aware:** Combines different analysis elements intelligently
4. **Person-Focused:** Special handling for person names ensures relevant portraits
5. **Relevance:** All queries scored and ranked for best results
6. **Fallback-Safe:** Multiple strategies ensure queries even with limited analysis data

## Example Output

For text about "Larry the farmer working in peaceful countryside":

**Generated Queries:**
1. "portrait man peaceful" (Person entity + theme)
2. "farmer countryside" (Keyword + keyword)
3. "peaceful nature" (Theme + theme)
4. "natural farm sunset" (Setting + keyword + lighting)
5. "portrait man rural" (Person + context)
6. "vibrant countryside" (Descriptor + keyword)
7. "farm work morning" (Three keywords)
8. "calm agriculture" (Mood + theme)

**Result:** Images of people in farming/rural settings with peaceful, natural aesthetics.
