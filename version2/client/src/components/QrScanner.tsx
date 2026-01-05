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
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                aspectRatio: 1.0
            },
      /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                // Success callback
                onScanSuccess(decodedText);
                // Clear scanner after successful scan
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
            },
            (errorMessage) => {
                // Error callback (optional)
                if (onScanFailure) onScanFailure(errorMessage);
            }
        );

        return () => {
            // Cleanup scanner on unmount
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
