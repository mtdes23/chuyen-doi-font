# Font Converter Pro

A premium, web-based tool built with **Next.js** and **Tailwind CSS** that converts modern `.woff2` web fonts into versatile `.ttf` and `.otf` formats for desktop and design tools.

## Features
- **Local Conversion Logic**: Powered by `fonteditor-core`, all conversion logic runs quickly and efficiently via a Next.js API Route.
- **Premium UI**: Smooth animations with Framer Motion, sleek dark aesthetic, and an intuitive drag-and-drop interface.
- **Ready for Production**: Fully compatible with Vercel configuration for seamless, one-click deployments.

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
