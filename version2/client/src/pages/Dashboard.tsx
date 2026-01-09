import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Upload, Plus, Image as ImageIcon, ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import CallHistory from "@/components/CallHistory";
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
            // Selfie is now first (index 0)
            if (profile.selfie_photo) {
                newPhotos[0] = profile.selfie_photo;
            }
            // Screensavers are offset by 1
            if (profile.screensaver_photos) {
                profile.screensaver_photos.forEach((url: string, i: number) => {
                    if (i < 10) newPhotos[i + 1] = url;
                });
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
        "Mom/Dad Selfie",
        "Screensaver 1", "Screensaver 2", "Screensaver 3", "Screensaver 4", "Screensaver 5",
        "Screensaver 6", "Screensaver 7", "Screensaver 8", "Screensaver 9", "Screensaver 10"
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
                if (index === 0) { // New Selfie index
                    updateData.selfie_photo = publicUrl;
                } else {
                    const currentPhotos = [...(profile?.screensaver_photos || [])];
                    currentPhotos[index - 1] = publicUrl; // Offset for screensavers
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
        if (!user) return null;

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
            return newKey;
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Generation Failed",
                description: error.message,
            });
            return null;
        }
    };

    const handleDownloadKey = async () => {
        let keyToDownload = profile?.secure_key;

        if (!keyToDownload) {
            toast({
                title: "Initializing Security",
                description: "Generating your first digital key...",
            });
            keyToDownload = await handleGenerateKey();
        }

        if (keyToDownload) {
            const element = document.createElement("a");
            const file = new Blob([keyToDownload], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = "android_secure_key.txt";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
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
        <div className="min-h-screen bg-[#2F7BCC] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="max-w-7xl mx-auto z-10 relative">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="space-y-2">
                        <Link href="/hub" className="inline-flex items-center text-xs font-bold tracking-widest uppercase text-white/60 hover:text-white transition-colors group mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Hub
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                        <span className="block text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white italic leading-none">
                            Mom in Home
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleLogOut}
                            className="bg-red-50 hover:bg-red-100 px-8 py-4 rounded-2xl border border-red-200 flex items-center gap-3 text-sm font-bold text-red-600 transition-all shadow-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Split Column Layout */}
                <div className="grid lg:grid-cols-[1fr_2px_1.5fr] gap-12 items-start">

                    {/* LEFT COLUMN: Actions */}
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-white/40">System Management</h2>
                            <p className="text-2xl font-bold text-white italic leading-tight">create your secure connection and home new devices</p>
                        </div>

                        <div className="space-y-6">
                            {/* Action 1 */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleDownloadKey}
                                className="w-full flex items-center p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl hover:border-red-100 transition-all group gap-8 text-left"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Smartphone className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-red-100">Action 1</h3>
                                    <p className="text-xl font-extrabold text-black uppercase">Download the Android Key</p>
                                    <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Secure Link for Mobile</p>
                                </div>
                            </motion.button>

                            {/* Action 2 */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleGenerateQR}
                                className="w-full flex items-center p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl hover:border-green-100 transition-all group gap-8 text-left"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Monitor className="w-8 h-8 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-green-100">Action 2</h3>
                                    <p className="text-xl font-extrabold text-black uppercase">Generate Code for Home Session</p>
                                    <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Instant Pairing for Station</p>
                                </div>
                            </motion.button>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-black/5 backdrop-blur-sm border border-black/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">
                                    End-to-End Encryption Active
                                </span>
                            </div>
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                        </div>

                        {/* Call History Tracker */}
                        <div className="bg-white/10 p-2 rounded-[2rem] shadow-sm backdrop-blur-sm overflow-hidden">
                            <CallHistory limit={10} variant="dark" />
                        </div>
                    </div>
                    {/* MIDDLE: Thick Divider */}
                    <div className="hidden lg:block w-1 h-full bg-gray-200/60 self-stretch rounded-full mx-auto shadow-sm" />

                    {/* RIGHT COLUMN: Photo Hub */}
                    <div className="space-y-8 bg-white/10 p-10 rounded-[3rem] border border-white/10 shadow-xl backdrop-blur-sm">
                        <div className="space-y-1">
                            <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">Family Asset Management</h2>
                            <p className="text-xl font-bold text-white italic">Upload photos for Home Station</p>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {photos.map((photo, index) => (
                                <motion.div
                                    key={index}
                                    onClick={() => handlePhotoUpload(index)}
                                    whileHover={{ scale: 1.05 }}
                                    className={`aspect-square bg-white rounded-3xl border transition-all overflow-hidden relative group cursor-pointer ${index === 0 ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] ring-2 ring-red-50' : 'border-gray-100 shadow-sm hover:border-green-400'
                                        }`}
                                >
                                    {isConverting === index ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-white/80">
                                            <div className="w-5 h-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                                        </div>
                                    ) : photo ? (
                                        <img src={photo} className="w-full h-full object-cover" alt={photoLabels[index]} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center space-y-1 bg-gray-50/50 group-hover:bg-green-50/30 transition-colors">
                                            <div className={`w-8 h-8 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${index === 0 ? 'border-red-200 group-hover:border-red-500' : 'border-gray-200 group-hover:border-green-500'
                                                }`}>
                                                <Plus className={`w-3 h-3 transition-colors ${index === 0 ? 'text-red-400' : 'text-gray-300 group-hover:text-green-500'
                                                    }`} />
                                            </div>
                                            <span className={`text-[8px] font-black tracking-tight uppercase transition-colors ${index === 0 ? 'text-red-500' : 'text-black group-hover:text-black'
                                                }`}>
                                                {photoLabels[index]}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="w-4 h-4 text-white" />
                                    </div>
                                </motion.div>
                            ))}
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
        </div>
    );
}
