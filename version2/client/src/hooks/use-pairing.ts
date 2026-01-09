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
            const { data, error } = await supabase
                .from("profiles")
                .select("id, secure_key")
                .eq("secure_key", key)
                .single();

            if (error || !data) {
                throw new Error("Invalid Secure Key.");
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

    const generatePairingCode = async () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { error } = await supabase
            .from("pairing_tokens")
            .insert({ token: code });

        if (error) throw error;
        return code;
    };

    const waitForPairing = async (code: string) => {
        return new Promise<{ secureKey: string, profileId: string } | null>((resolve) => {
            const subscription = supabase
                .channel('pairing_changes')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pairing_tokens',
                    filter: `token=eq.${code}`
                }, (payload: any) => {
                    if (payload.new.secure_key && payload.new.profile_id) {
                        subscription.unsubscribe();
                        resolve({
                            secureKey: payload.new.secure_key,
                            profileId: payload.new.profile_id
                        });
                    }
                })
                .subscribe();

            // Timeout after 1 hour
            setTimeout(() => {
                subscription.unsubscribe();
                resolve(null);
            }, 3600000);
        });
    };

    const pairDeviceWithCode = async (code: string, profileId: string, secureKey: string) => {
        const { error } = await supabase
            .from("pairing_tokens")
            .update({ profile_id: profileId, secure_key: secureKey })
            .eq("token", code);

        if (error) throw error;
        return { success: true };
    };

    const unpair = () => {
        localStorage.removeItem("intercom_pairing");
        setPairing({ isPaired: false, secureKey: null, profileId: null, pairingType: null });
    };

    return {
        ...pairing,
        isValidating,
        validateAndPair,
        generatePairingCode,
        waitForPairing,
        pairDeviceWithCode,
        unpair
    };
}
