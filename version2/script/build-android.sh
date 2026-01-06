#!/bin/bash

# Android APK Build Script for MaainHome
# This script builds the web assets and prepares the Android project for APK generation.

set -e

echo "🚀 Starting Android Build Process..."

# 1. Build the React application
echo "📦 Building web assets..."
npm run build

# 2. Sync assets with Capacitor
echo "🔄 Syncing with Capacitor Android..."
npx cap sync android

# 3. Build the APK using Gradle
echo "🏗️ Building Android APK (Debug)..."
cd android
./gradlew assembleDebug

echo "✅ Build Complete!"
echo "📍 APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
