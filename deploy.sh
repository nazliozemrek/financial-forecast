#!/bin/bash

echo "🚀 Financial Forecast - Deployment Script"
echo "=========================================="

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
    echo "❌ nvm is not installed. Please install nvm first."
    echo "   Visit: https://github.com/nvm-sh/nvm#installing-and-updating"
    exit 1
fi

# Use Node.js 20
echo "📦 Using Node.js 20..."
nvm use 20

# Check if yarn is available
if ! command -v yarn &> /dev/null; then
    echo "❌ yarn is not installed. Installing yarn..."
    npm install -g yarn
fi

# Install dependencies
echo "📥 Installing dependencies..."
yarn install

# Build for production
echo "🔨 Building for production..."
yarn build:prod

echo "✅ Build completed successfully!"
echo ""
echo "📱 Next steps for App Store submission:"
echo "1. Deploy the 'dist' folder to your hosting platform"
echo "2. Create App Store Connect account"
echo "3. Follow the guide in APP_STORE_GUIDE.md"
echo ""
echo "🚀 Quick deployment options:"
echo "• Vercel: npx vercel --prod"
echo "• Netlify: Upload 'dist' folder to Netlify"
echo "• Firebase: firebase init hosting && firebase deploy"
echo ""
echo "📋 Don't forget to:"
echo "• Create app screenshots"
echo "• Design app icon (1024x1024)"
echo "• Write app description"
echo "• Host privacy policy publicly"
echo ""
echo "🎉 Your app is ready for App Store submission!"
