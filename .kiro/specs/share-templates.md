# Social Media Share Templates

## Overview

Each social platform has a customized, catchy share template that promotes DocSpice while sharing the article.

## Templates by Platform

### WhatsApp
```
✨ Just transformed my text into this stunning visual story with DocSpice! 📖✨

"[Article Title]"

Check it out: [URL]

🎨 Try it yourself at DocSpice!
```

**Features:**
- Emojis for visual appeal
- Personal tone ("my text")
- Call-to-action to try DocSpice
- Direct link

---

### Facebook
```
I just created this beautifully illustrated article with DocSpice! 🎨📚

"[Article Title]"

DocSpice turned my plain text into a visual masterpiece with AI-powered image matching. You've got to see this! ✨
```

**Features:**
- Enthusiastic tone
- Explains what DocSpice does
- Emphasizes the transformation
- Encourages viewing

---

### X (Twitter)
```
✨ Just created "[Article Title]" with @DocSpice! 🎨

Turned plain text into a stunning visual story in seconds. Check it out! 👇

#ContentCreation #VisualStorytelling
```

**Features:**
- Concise (Twitter-friendly)
- Mentions @DocSpice (if account exists)
- Relevant hashtags
- Emoji indicators
- Under character limit

---

### Instagram
```
✨ Created with DocSpice ✨

"[Article Title]"

🎨 Transformed plain text into this beautiful visual story
📖 AI-powered image matching
✨ Try it yourself!

[URL]

#DocSpice #VisualStorytelling #ContentCreation #AIArt
```

**Features:**
- Formatted for caption
- Bullet points with emojis
- Multiple relevant hashtags
- Includes URL for bio/story
- Visually structured

---

## Implementation Details

### Dynamic Content
Each template includes:
- **Article Title:** Dynamically inserted
- **URL:** Current article URL
- **Platform-specific formatting:** Optimized for each platform's style

### User Experience

**WhatsApp/Facebook/Twitter:**
- Opens share dialog with pre-filled template
- User can edit before posting
- One-click sharing

**Instagram:**
- Copies full template to clipboard
- Shows friendly alert: "✨ Caption copied! Paste it in Instagram with your screenshot or link. 📸"
- User pastes in Instagram app

### Encoding
- URLs are properly encoded
- Special characters handled
- Emoji support maintained

## Benefits

1. **Brand Awareness:** Every share mentions DocSpice
2. **Viral Potential:** Catchy, emoji-rich templates encourage sharing
3. **Clear Value Prop:** Explains what DocSpice does
4. **Call-to-Action:** Encourages others to try it
5. **Platform-Optimized:** Each template fits platform norms
6. **Professional:** Well-formatted, not spammy

## Customization

Templates can be easily updated in `src/app/article/[id]/page.tsx`:

```typescript
const getShareTemplate = (platform: string) => {
  const templates = {
    whatsapp: `...`,
    facebook: `...`,
    twitter: `...`,
    instagram: `...`
  };
  return templates[platform];
};
```

## Future Enhancements

Potential improvements:
- A/B test different templates
- Personalization based on article themes
- Dynamic hashtag generation
- Image preview in shares
- Share analytics tracking
