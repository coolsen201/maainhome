import { Capacitor } from '@capacitor/core';

export enum Platform {
    Android = 'android',
    Electron = 'electron',
    Web = 'web'
}

export function detectPlatform(): Platform {
    // Check Capacitor for native Android
    if (Capacitor.getPlatform() === 'android') {
        return Platform.Android;
    }

    // Check User Agent for Electron
    if (typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')) {
        return Platform.Electron;
    }

    // Fallback to Web
    return Platform.Web;
}

export const isAndroid = detectPlatform() === Platform.Android;
export const isElectron = detectPlatform() === Platform.Electron;
export const isWeb = detectPlatform() === Platform.Web;
