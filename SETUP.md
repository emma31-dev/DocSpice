# DocSpice Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd docspice
   npm install
   ```

2. **Set up Unsplash API (Required for images)**
   - Visit [https://unsplash.com/developers](https://unsplash.com/developers)
   - Sign up/Login and create a new application
   - Copy your **Access Key**
   - Create `.env.local` file:
     ```env
     NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
     ```

3. **Run the application**
   ```bash
   npm run dev
   ```
   
4. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Features

✅ **Smart Text Analysis** - AI-powered keyword extraction  
✅ **Beautiful Image Matching** - Automatic Unsplash image selection  
✅ **Responsive Design** - Works on all devices  
✅ **No Authentication** - Simple, friction-free experience  
✅ **Instant Generation** - Transform text in seconds  

## Usage

1. Paste your text content into the input area
2. Click "Transform with DocSpice"
3. Watch as your content becomes a beautiful illustrated article!

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Natural.js** for text analysis
- **Unsplash API** for high-quality images
- **Lucide React** for icons

## Need Help?

- Check the README.md for detailed documentation
- Ensure your Unsplash API key is correctly set in `.env.local`
- Make sure you're running Node.js 18 or higher