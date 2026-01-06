#!/bin/bash

# MaainHome One-Click APK Build Script
# This script sets up the environment and builds the Android APK.

# 1. Set the Environment
echo "🔧 Setting up build environment..."
export JAVA_HOME=$HOME/android-studio/jbr
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

# 2. Run the Build
echo "🚀 Starting MaainHome APK Build..."
cd /home/senthil/maainhome/version2
npm run android:apk

echo ""
echo "✅ Build Process Finished!"
echo "📍 APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
echo "--------------------------------------------------"
echo "⚠️ IMPORTANT FOR UPDATES:"
echo "If you don't see the new UI (Brown Background), follow these steps:"
echo "1. UNINSTALL the app from your phone."
echo "2. RE-INSTALL using the new APK."
echo "3. If still not working: Go to Phone Settings -> Apps -> MaainHome -> Storage"
echo "   -> Clear Cache AND Clear Data."
echo "--------------------------------------------------"
