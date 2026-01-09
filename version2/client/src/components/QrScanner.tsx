import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Loader2, Zap } from 'lucide-react';

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
}

export function QrScanner({ onScanSuccess }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScannerReady, setIsScannerReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const startScanner = async () => {
            try {
                // Use most appropriate camera (prefer back-facing on mobile, or first available on PC)
                await scanner.start(
                    { facingMode: "user" }, // Usually HomeStation is used with a front-cam/user-facing cam
                    {
                        fps: 25, // High FPS for smoother detection
                        aspectRatio: 1.0,
                        // NO qrbox here -> Scans the WHOLE frame for maximum reliability
                    },
                    (decodedText) => {
                        onScanSuccess(decodedText);
                        // Don't stop immediately to avoid UI flicker, let the parent handle logic
                    },
                    () => {
                        // Silent failure for frame-by-frame errors
                    }
                );
                setIsScannerReady(true);
            } catch (err: any) {
                console.error("Scanner failed to start:", err);
                setError("Camera blocked or not found.");
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="relative w-64 h-64 overflow-hidden rounded-[2.5rem] bg-black group border-4 border-white/5 shadow-2xl">
            {/* The actual video element */}
            <div id="reader" className="w-full h-full object-cover scale-110" />

            {/* Overlays */}
            {!isScannerReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]">Waking Camera...</span>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center z-10">
                    <Zap className="w-8 h-8 text-red-500 mb-2 opacity-50" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-relaxed">
                        Camera Error
                    </span>
                    <p className="text-[8px] text-white/30 mt-1">{error}</p>
                </div>
            )}

            {isScannerReady && (
                <>
                    {/* Futuristic Corner Guides */}
                    <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-red-500/50 rounded-tl-xl transition-all group-hover:scale-110" />
                    <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-red-500/50 rounded-tr-xl transition-all group-hover:scale-110" />
                    <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-red-500/50 rounded-bl-xl transition-all group-hover:scale-110" />
                    <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-red-500/50 rounded-br-xl transition-all group-hover:scale-110" />

                    {/* Scanning Laser Line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-qr-scan z-20" />

                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none" />
                </>
            )}
        </div>
    );
}
