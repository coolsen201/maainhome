import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: string) => void;
}

export function QrScanner({ onScanSuccess, onScanFailure }: QrScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize the scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 20,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdgeSize * 0.7);
                    return { width: qrboxSize, height: qrboxSize };
                },
                rememberLastUsedCamera: true,
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
            },
      /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                onScanSuccess(decodedText);
                scanner.clear().catch(console.error);
            },
            (errorMessage) => {
                // Occasional failures are normal as it scans frame by frame
                if (onScanFailure) onScanFailure(errorMessage);
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md">
            <div id="reader" className="w-full"></div>
        </div>
    );
}
