import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import HomeStation from "@/pages/HomeStation";
import RemoteViewer from "@/pages/RemoteViewer";
import Hub from "@/pages/Hub";
import { useEffect } from "react";
import { isAndroid, isElectron } from "@/lib/platform";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

function SmartRedirect() {
  const [pathname, setLocation] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check for permanent security key redirect (Android optimization)
      const permanentKey = localStorage.getItem('permanent_secure_key');

      if (pathname === "/") {
        if (session) {
          if (isElectron) setLocation("/home");
          else if (isAndroid && permanentKey) setLocation("/remote");
          else setLocation("/hub");
        } else if (isAndroid && permanentKey) {
          // Even without a full session, if we have the key, we can try to go to remote
          // where the use-webrtc hook will use the key. 
          // However, most routes are protected. Let's redirect to remote and let the 
          // auth guard handle it if they need to log in first.
          // Actually, if they have the key but no session, we should probably still require login
          // UNLESS we want the key to be the sole auth. 
          // User said: "dont have to relogin next time when closing and reopening the app it will go for remote page directly"
          // This implies the key is enough or we should keep them logged in.
          // Since we changed to localStorage, the session should persist.
          setLocation("/remote");
        }
      } else if (["/home", "/remote", "/hub", "/dashboard"].includes(pathname)) {
        if (!session && !permanentKey) {
          setLocation("/");
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setLocation("/");
    });

    return () => subscription.unsubscribe();
  }, [pathname, setLocation]);

  return null;
}

function Router() {
  return (
    <>
      <SmartRedirect />
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/register" component={Register} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/hub" component={Hub} />
        <Route path="/home" component={HomeStation} />
        <Route path="/remote" component={RemoteViewer} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
