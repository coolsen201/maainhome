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
import { useEffect } from "react";
import { isAndroid, isElectron } from "@/lib/platform";
import { useLocation } from "wouter";

function SmartRedirect() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/") {
      if (isAndroid) {
        setLocation("/remote");
      } else if (isElectron) {
        setLocation("/home");
      }
    }
  }, [location, setLocation]);

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
