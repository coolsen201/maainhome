import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Monitor, Smartphone, Upload, Plus, Image as ImageIcon, ArrowLeft, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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

    const handleGenerateQR = () => {
        if (!profile?.secure_key) {
            toast({
                variant: "destructive",
                title: "No Key Found",
                description: "Generating a new key for your system...",
            });
            handleGenerateKey();
            return;
        }
        setShowQRModal(true);
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

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Left Column: Quick Actions & Security */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-black/30 px-2">Launch Services</h2>
                            <div className="space-y-4">
                                <Link href="/home">
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-green-500/50 hover:shadow-lg cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                                <Monitor className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-black group-hover:text-green-600 transition-colors">Home Station</h3>
                                                <p className="text-xs text-black/40">Launch main camera unit</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>

                                <Link href="/remote">
                                    <motion.div
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-red-500/50 hover:shadow-lg cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                                <Smartphone className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-black group-hover:text-red-600 transition-colors">Remote Viewer</h3>
                                                <p className="text-xs text-black/40">Connect from mobile device</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </div>
                        </div>

                        {/* Security & Access Section */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-6">
                            <h3 className="font-bold text-black flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-green-600" />
                                Security & Access
                            </h3>

                            <div className="space-y-4">
                                <button
                                    onClick={handleGenerateKey}
                                    className="w-full py-4 rounded-2xl bg-red-600 border border-red-700 text-white text-xs font-bold tracking-widest uppercase hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-3 group"
                                >
                                    <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Generate New Digital Key
                                </button>

                                <button
                                    onClick={handleDownloadKey}
                                    className="w-full py-4 rounded-2xl bg-white border border-gray-200 text-black text-xs font-bold tracking-widest uppercase hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3 group"
                                >
                                    <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Download Android Key
                                </button>

                                <button
                                    onClick={handleGenerateQR}
                                    className="w-full py-4 rounded-2xl bg-white border border-gray-200 text-black text-xs font-bold tracking-widest uppercase hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3 group"
                                >
                                    <Monitor className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Show Multi-Service QR
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-black/20">Key Validity Period</span>
                                    <span className="text-sm font-mono text-green-600">
                                        Valid until: {profile?.key_expiry ? new Date(profile.key_expiry).toLocaleDateString() : 'Loading...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Photo Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-black/30">Family Asset Management</h2>
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-green-600 animate-pulse">Auto-convert to PNG active</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {photos.map((photo, index) => (
                                <motion.div
                                    key={index}
                                    onClick={() => handlePhotoUpload(index)}
                                    whileHover={{ scale: 1.05 }}
                                    className={`aspect-square bg-white rounded-2xl border transition-all overflow-hidden relative group cursor-pointer ${index === 10 ? 'border-red-500/30' : 'border-gray-100 shadow-sm'
                                        }`}
                                >
                                    {isConverting === index ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-white/80">
                                            <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin mb-2" />
                                            <span className="text-[8px] font-bold text-green-600 tracking-[0.3em] uppercase">PNG Convert</span>
                                        </div>
                                    ) : photo ? (
                                        <img src={photo} className="w-full h-full object-cover" alt={photoLabels[index]} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                                            <div className={`w-10 h-10 rounded-full border border-dashed flex items-center justify-center transition-colors ${index === 10 ? 'border-red-500/50 group-hover:border-red-600' : 'border-gray-300 group-hover:border-green-600'
                                                }`}>
                                                <Plus className={`w-4 h-4 transition-colors ${index === 10 ? 'text-red-600' : 'text-gray-400 group-hover:text-green-600'
                                                    }`} />
                                            </div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors ${index === 10 ? 'text-red-600' : 'text-black/20 group-hover:text-black/40'
                                                }`}>
                                                {photoLabels[index]}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-5 h-5 text-white" />
                                            <span className="text-[8px] font-bold text-white/60 tracking-widest uppercase">Select & Convert</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[2.2rem] bg-green-50 border border-green-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-black mb-1">Screensaver Logic</h4>
                                        <p className="text-[10px] text-black/60 leading-relaxed">
                                            The top 10 photos are loaded for the **Home Station** screensaver. They rotate automatically when the station is idle.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-[2.2rem] bg-red-50 border border-red-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                        <Smartphone className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-black mb-1">Remote Selfie</h4>
                                        <p className="text-[10px] text-black/60 leading-relaxed">
                                            Slot 11 is dedicated to the **Remote Viewer**. This image will be used as your caller ID/Profile info when connecting home.
                                        </p>
                                    </div>
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
                            STATION AUTH QR
                        </DialogTitle>
                        <DialogDescription className="text-black/40 font-mono text-xs uppercase tracking-[0.2em]">
                            Scan this code with the Android App to pair your Home Station
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center space-y-8 py-8">
                        <div className="p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.15)] border border-gray-100">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`MOM_IN_HOME_AUTH:${profile?.secure_key}`)}`}
                                alt="Pairing QR Code"
                                className="w-48 h-48"
                            />
                        </div>

                        <div className="space-y-2 text-center w-full">
                            <p className="text-[10px] text-black/20 font-bold uppercase tracking-widest leading-relaxed">
                                This code contains your unique 256-bit encrypted secure key.
                            </p>
                            <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 truncate max-w-full">
                                <code className="text-[8px] text-green-600 font-mono">{profile?.secure_key}</code>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
