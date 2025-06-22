import { Switch, Route, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (user && !error) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/bots" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/commands" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
