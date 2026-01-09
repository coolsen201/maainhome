import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Upload, Plus, Image as ImageIcon, ArrowLeft, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { usePairing } from "@/hooks/use-pairing";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [photos, setPhotos] = useState<Array<string | null>>(Array(11).fill(null));
    const [isConverting, setIsConverting] = useState<number | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const { pairDeviceWithCode, generatePairingCode } = usePairing();
    const [pairingCode, setPairingCode] = useState("");
    const [isPairing, setIsPairing] = useState(false);
    const [qrToken, setQrToken] = useState<string | null>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            setLocation("/");
        }
    }, [user, authLoading, setLocation]);

    // Sync state with profile data
    useEffect(() => {
        if (profile) {
            const newPhotos = Array(11).fill(null);
            if (profile.screensaver_photos) {
                profile.screensaver_photos.forEach((url: string, i: number) => {
                    if (i < 10) newPhotos[i] = url;
                });
            }
            if (profile.selfie_photo) {
                newPhotos[10] = profile.selfie_photo;
            }
            setPhotos(newPhotos);
        }
    }, [profile]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const handleLogOut = async () => {
        await signOut();
        setLocation("/");
    };

    const photoLabels = [
        "Screensaver 1", "Screensaver 2", "Screensaver 3", "Screensaver 4", "Screensaver 5",
        "Screensaver 6", "Screensaver 7", "Screensaver 8", "Screensaver 9", "Screensaver 10",
        "Mom/Dad Selfie"
    ];

    const handlePhotoUpload = (index: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file || !user) return;

            setIsConverting(index);

            try {
                // 1. Convert to PNG using Canvas
                const convertToPng = (file: File): Promise<Blob> => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement("canvas");
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext("2d");
                            ctx?.drawImage(img, 0, 0);
                            canvas.toBlob((blob) => {
                                if (blob) resolve(blob);
                                else reject(new Error("Canvas conversion failed"));
                            }, "image/png");
                        };
                        img.onerror = () => reject(new Error("Image load failed"));
                        img.src = URL.createObjectURL(file);
                    });
                };

                const pngBlob = await convertToPng(file);

                // 2. Upload to Supabase Storage
                const fileName = `${user.id}/${index}_${Date.now()}.png`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('assets')
                    .upload(filePath, pngBlob, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('assets')
                    .getPublicUrl(filePath);

                // 3. Update Database Profile
                const updateData: any = {};
                if (index === 10) {
                    updateData.selfie_photo = publicUrl;
                } else {
                    const currentPhotos = [...(profile?.screensaver_photos || [])];
                    currentPhotos[index] = publicUrl;
                    updateData.screensaver_photos = currentPhotos;
                }

                const { id: profileId, ...restProfile } = profile || {};
                const { error: updateError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        ...restProfile,
                        ...updateData
                    });

                if (updateError) throw updateError;

                toast({
                    title: "Upload Successful",
                    description: `${photoLabels[index]} has been updated.`,
                });

                refreshProfile(); // Refresh UI
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: error.message,
                });
            } finally {
                setIsConverting(null);
            }
        };
        input.click();
    };

    const generateSecureKey = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
        let key = "";
        for (let i = 0; i < 256; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    };

    const handleGenerateKey = async () => {
        if (!user) return;

        try {
            const newKey = generateSecureKey();
            const { id: profileId, ...restProfile } = profile || {};
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...restProfile,
                    secure_key: newKey,
                    key_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
                });

            if (error) throw error;

            toast({
                title: "New Key Generated",
                description: "Your system has been assigned a new 256-bit secure key.",
            });
            refreshProfile();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: error.message,
            });
        }
    };

    const handleDownloadKey = () => {
        if (!profile?.secure_key) {
            toast({
                variant: "destructive",
                title: "No Key Found",
                description: "Generating a new key for you...",
            });
            handleGenerateKey();
            return;
        }

        const element = document.createElement("a");
        const file = new Blob([profile.secure_key], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "android_secure_key.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };


    const handlePairWithCode = async () => {
        if (pairingCode.length !== 6 || !profile?.secure_key) {
            toast({ variant: "destructive", title: "Invalid Code", description: "Please enter a 6-digit code." });
            return;
        }
        setIsPairing(true);
        try {
            const result = await pairDeviceWithCode(pairingCode, profile.id, profile.secure_key);
            if (result.success) {
                toast({ title: "Station Linked", description: "Your Home Station is now paired!" });
                setPairingCode("");
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Pairing Failed", description: error.message });
        } finally {
            setIsPairing(false);
        }
    };

    const handleGenerateQR = async () => {
        if (!profile?.secure_key || !user) {
            toast({
                variant: "destructive",
                title: "No Key Found",
                description: "Generating a new key for your system...",
            });
            await handleGenerateKey();
            return;
        }

        try {
            const token = await generatePairingCode();
            await pairDeviceWithCode(token, user.id, profile.secure_key);
            setQrToken(token);
            setShowQRModal(true);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "QR Generation Failed",
                description: error.message,
            });
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 text-black p-6 md:p-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-7xl mx-auto z-10 relative">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-black/40 hover:text-red-600 transition-colors group mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Landing
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-red-600">System Dashboard</h1>
                        <span className="block text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-black italic leading-none">
                            Mom in Home
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <button className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-2xl border border-gray-200 flex items-center gap-3 text-sm font-bold text-black/60 transition-all">
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                        <button
                            onClick={handleLogOut}
                            className="bg-red-50 hover:bg-red-100 px-6 py-3 rounded-2xl border border-red-200 flex items-center gap-3 text-sm font-bold text-red-600 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto">
                    {/* Main Management Hub */}
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-12">
                        <div className="text-center space-y-2">
                            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-black/20">System Management</h2>
                            <p className="text-lg font-bold text-black italic">Manage your secure connection and pair new devices</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* 1. Generate New Key for Android */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateKey}
                                className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-red-50 border border-red-100 hover:bg-red-100 transition-all group gap-4 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg group-hover:shadow-red-600/20 transition-all">
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black tracking-widest uppercase text-red-600">Step 1</h3>
                                    <p className="text-xs font-bold text-black uppercase">Generate New Key<br />for Android</p>
                                </div>
                            </motion.button>

                            {/* 2. Download the Key */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDownloadKey}
                                className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all group gap-4 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg transition-all">
                                    <Smartphone className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black tracking-widest uppercase text-black/20">Step 2</h3>
                                    <p className="text-xs font-bold text-black uppercase">Download<br />the Key</p>
                                </div>
                            </motion.button>

                            {/* 3. Generate Code for Home Session */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateQR}
                                className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-green-50 border border-green-100 hover:bg-green-100 transition-all group gap-4 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg group-hover:shadow-green-600/20 transition-all">
                                    <Monitor className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black tracking-widest uppercase text-green-600">Step 3</h3>
                                    <p className="text-xs font-bold text-black uppercase">Generate Code<br />for Home Session</p>
                                </div>
                            </motion.button>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/20">Current Key Security Status</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-mono font-bold text-green-600">
                                        Encryption Active (Valid until: {profile?.key_expiry ? new Date(profile.key_expiry).toLocaleDateString() : 'Loading...'})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                <DialogContent className="bg-white border-gray-200 sm:max-w-md rounded-[2.5rem] p-10">
                    <DialogHeader className="space-y-4 text-center">
                        <DialogTitle className="text-3xl font-black italic tracking-tighter text-red-600">
                            STATION PAIRING QR
                        </DialogTitle>
                        <DialogDescription className="text-black/40 font-mono text-xs uppercase tracking-[0.2em]">
                            Scan this with the Home Station to link this account
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center space-y-8 py-8">
                        <div className="p-8 bg-white rounded-[3rem] shadow-[0_0_80px_rgba(220,38,38,0.15)] border-4 border-red-50">
                            {qrToken ? (
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${qrToken}&margin=10`}
                                    alt="Pairing QR Code"
                                    className="w-64 h-64"
                                />
                            ) : (
                                <div className="w-64 h-64 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 text-center w-full">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest">Single-Use Code</span>
                                <span className="text-4xl font-black tracking-[0.5em] text-black bg-gray-50 py-4 rounded-2xl border border-gray-100 italic">
                                    {qrToken}
                                </span>
                            </div>
                            <p className="text-[10px] text-black/30 font-bold uppercase leading-relaxed px-4">
                                This simplified QR and code will expire in **1 hour**.
                                Use it to pair your Home Station without a keyboard.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
