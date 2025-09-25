# DocSpice - Troubleshooting Image Issues

## 🔍 Testing Image Functionality

### 1. Test the Image API
Visit: `http://localhost:3000/api/test-images?query=nature`

**Expected Responses:**

✅ **With Unsplash API Key:**
```json
{
  "success": true,
  "source": "unsplash",
  "query": "nature",
  "count": 3,
  "images": [...]
}
```

⚠️ **Without API Key:**
```json
{
  "success": true,
  "source": "fallback",
  "message": "No Unsplash images found or API key not configured",
  "count": 3,
  "images": [...]
}
```

❌ **Error:**
```json
{
  "success": false,
  "error": "Failed to fetch images",
  "details": "..."
}
```

## 🔧 Common Issues & Solutions

### Issue 1: "No images showing"
**Cause:** Missing or invalid Unsplash API key

**Solution:**
1. Get API key from https://unsplash.com/developers
2. Add to `.env.local`:
   ```
   UNSPLASH_ACCESS_KEY=your_real_api_key_here
   ```
3. Restart the dev server: `npm run dev`

### Issue 2: "401 Unauthorized"
**Cause:** Invalid API key

**Check:**
- API key format (should be ~43 characters)
- No spaces or quotes around the key
- Using `UNSPLASH_ACCESS_KEY` not `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`

### Issue 3: "403 Rate Limit Exceeded"
**Cause:** Too many API requests

**Solutions:**
- Wait 1 hour (demo accounts have 50 requests/hour)
- App will automatically use fallback images
- Consider upgrading Unsplash plan for production

### Issue 4: "CORS errors"
**Cause:** Client-side API calls (now fixed)

**Status:** ✅ Fixed - API calls now happen server-side only

### Issue 5: Images loading slowly
**Solutions:**
- Check internet connection
- Unsplash images are high-quality (can be large)
- App includes loading states and error handling

## 🚀 Quick Fixes

### Force Fallback Images (for testing)
Temporarily comment out the API key in `.env.local`:
```
# UNSPLASH_ACCESS_KEY=your_key_here
```

### Clear Cache
```bash
# Delete .next folder and restart
rm -rf .next
npm run dev
```

### Check Logs
Look at browser console and terminal for error messages:
- Browser: F12 → Console
- Terminal: Check where you ran `npm run dev`

## 📋 Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` file created
- [ ] Unsplash API key added (optional but recommended)
- [ ] Dev server running (`npm run dev`)
- [ ] No console errors in browser

## 🔍 Debug Steps

1. **Test API endpoint:** `/api/test-images`
2. **Check environment:** Verify `.env.local` file
3. **Restart server:** Stop and run `npm run dev` again
4. **Check console:** Look for error messages
5. **Test fallbacks:** App should work even without API key

## 💡 Pro Tips

- **Free tier limit:** 50 requests/hour per API key
- **Fallback images:** Always available, no API key needed  
- **Image quality:** Unsplash provides multiple sizes automatically
- **Rate limiting:** App includes delays to respect limits

## 🆘 Still Having Issues?

1. Check the browser's developer console (F12)
2. Look at the terminal where you ran `npm run dev`
3. Test with the `/api/test-images` endpoint
4. Verify your `.env.local` file format

The app is designed to work perfectly with beautiful fallback images even without the Unsplash API key!