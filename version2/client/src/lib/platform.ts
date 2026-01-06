import { Capacitor } from '@capacitor/core';

export enum Platform {
    Android = 'android',
    Electron = 'electron',
    Web = 'web'
}

export function detectPlatform(): Platform {
    // Check for Electron first as it might have specific UA or globals
    if (typeof window !== 'undefined' &&
        (window.navigator.userAgent.toLowerCase().includes('electron') ||
            (window as any).process?.versions?.electron)) {
        return Platform.Electron;
    }

    // Check Capacitor for native Android
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        return Platform.Android;
    }

    // Check User Agent fallback for Android browsers
    if (typeof window !== 'undefined') {
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.includes('android')) return Platform.Android;
    }

    // Fallback to Web
    return Platform.Web;
}

export const isAndroid = detectPlatform() === Platform.Android;
export const isElectron = detectPlatform() === Platform.Electron;
export const isWeb = detectPlatform() === Platform.Web;
