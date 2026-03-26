#!/bin/bash

# Font Converter Pro - Deployment Script
# This script automates building and preparing the app for deployment

set -e

echo "🚀 Font Converter Pro - Deployment Helper"
echo "=========================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo ""

# Step 1: Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build production app
echo "🔨 Building production app..."
npm run build

# Step 4: Create deployment folder
DEPLOY_FOLDER="./deploy-output"
echo "📁 Creating deployment folder: $DEPLOY_FOLDER"
rm -rf $DEPLOY_FOLDER
mkdir -p $DEPLOY_FOLDER

# Step 5: Copy files needed for deployment
echo "📋 Copying files for deployment..."
cp -r .next $DEPLOY_FOLDER/
cp -r public $DEPLOY_FOLDER/
cp package.json $DEPLOY_FOLDER/
cp next.config.ts $DEPLOY_FOLDER/
cp Dockerfile $DEPLOY_FOLDER/
cp docker-compose.yml $DEPLOY_FOLDER/

echo ""
echo "✅ Build complete!"
echo ""
echo "📊 Deployment folder created: $DEPLOY_FOLDER"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  To run locally:"
echo "   npm start"
echo ""
echo "2️⃣  To deploy with Docker:"
echo "   docker build -t font-converter ."
echo "   docker run -p 3000:3000 font-converter"
echo ""
echo "3️⃣  To deploy with Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "4️⃣  To copy to hosting folder:"
echo "   cp -r $DEPLOY_FOLDER/* /path/to/hosting/folder/"
echo ""
echo "🌐 Access the app at: http://localhost:3000"
