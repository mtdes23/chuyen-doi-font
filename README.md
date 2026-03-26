# Font Converter Pro

A premium, web-based tool built with **Next.js** and **Tailwind CSS** that converts modern and classic font formats into your desired output format for desktop, design tools, and web use.

## Features
- **8 Input + 7 Output Formats**: Support for TTF, OTF, WOFF, WOFF2, SVG, EOT, Variable fonts, and AFM metrics
- **Flexible Conversion**: Convert between any formats with one click
- **Font Metadata Extraction**: Automatically detect font family, style, version, and whether it's variable
- **Vector & Bitmap Support**: Handle both traditional and SVG vector fonts
- **Local Conversion Logic**: All conversion runs securely via Next.js API Route
- **Premium UI**: Smooth animations with Framer Motion and intuitive categorized format selector
- **Batch Processing**: Convert up to 10 files simultaneously
- **Ready for Production**: Fully compatible with Vercel configuration

## Supported Formats

### Input Formats (8 formats supported)
- **TTF** (TrueType Font) - Classic desktop font format
- **OTF** (OpenType Font) - Modern font format with advanced features
- **Variable TTF** (.var-ttf) - Single font file with multiple weight/width variations
- **WOFF** (Web Open Font Format) - Optimized web font format
- **WOFF2** (Web Open Font Format 2) - Highly compressed web font format
- **SVG** (Scalable Vector Graphics Font) - Vector-based font for animations
- **EOT** (Embedded OpenType) - Legacy web font format for older IE versions
- **AFM** (Adobe Font Metrics) - Text-based font metrics file (extract-only)

### Output Formats (7 formats)
- **TTF** (TrueType Font) - For desktop and design applications (Adobe, Figma, etc.)
- **OTF** (OpenType Font) - For advanced typography with OpenType features
- **Variable TTF** (.var-ttf) - Single file with full font variations
- **WOFF** (Web Open Font Format) - For web use on all modern browsers
- **WOFF2** (Web Open Font Format 2) - For modern web with best compression
- **SVG Font** - For web animations and vector-based rendering
- **AFM** (Adobe Font Metrics) - Text-based metrics for font specifications

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Select Output Format**: Choose your desired output format (TTF, OTF, WOFF, or WOFF2) from the format selector
2. **Upload Fonts**: Drag and drop or click to select up to 10 font files in any supported format
3. **Convert**: Click the "Convert" button to start the batch conversion
4. **Download**: Once complete, download all converted fonts as a ZIP file

### Example Workflows
- **Desktop to Web**: Convert TTF → WOFF2 for optimal web performance
- **Web to Desktop**: Convert WOFF2 → TTF for use in Adobe Creative Suite or Figma
- **Web Animation**: Convert TTF → SVG Font for CSS animations and vector rendering
- **Legacy Browser Support**: Convert modern fonts → EOT for Internet Explorer compatibility
- **Variable Font Distribution**: Convert traditional fonts → Variable TTF to reduce download size
- **Font Metrics Export**: Convert any font → AFM to extract detailed metrics and specifications
- **Format Migration**: Convert between any supported formats with one click

## Deployment

### Deploying to GitHub
1. Initialize a git repository with `git init`.
2. Commit all your changes: `git add . && git commit -m "Initial commit"`
3. Create a repository on GitHub.
4. Add the remote URL and push: `git remote add origin <url>` and `git push -u origin main`.

### Deploying to Vercel
Because this project is built using standard Next.js conventions, it is completely zero-config for Vercel!
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically detect Next.js and build your app. 
