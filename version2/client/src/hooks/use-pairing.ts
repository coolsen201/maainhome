import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type PairingState = {
    isPaired: boolean;
    secureKey: string | null;
    profileId: string | null;
    pairingType: "home" | "remote" | null;
};

export function usePairing() {
    const [pairing, setPairing] = useState<PairingState>(() => {
        const saved = localStorage.getItem("intercom_pairing");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return { isPaired: false, secureKey: null, profileId: null, pairingType: null };
            }
        }
        return { isPaired: false, secureKey: null, profileId: null, pairingType: null };
    });

    const [isValidating, setIsValidating] = useState(false);

    const validateAndPair = async (key: string, type: "home" | "remote") => {
        setIsValidating(true);
        try {
            // Find the profile with this secure key
            const { data, error } = await supabase
                .from("profiles")
                .select("id, secure_key")
                .eq("secure_key", key)
                .single();

            if (error || !data) {
                throw new Error("Invalid Secure Key. Please check the QR code or key file.");
            }

            const newState: PairingState = {
                isPaired: true,
                secureKey: key,
                profileId: data.id,
                pairingType: type
            };

            localStorage.setItem("intercom_pairing", JSON.stringify(newState));
            setPairing(newState);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setIsValidating(false);
        }
    };

    const unpair = () => {
        localStorage.removeItem("intercom_pairing");
        setPairing({ isPaired: false, secureKey: null, profileId: null, pairingType: null });
    };

    return {
        ...pairing,
        isValidating,
        validateAndPair,
        unpair
    };
}
