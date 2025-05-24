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
  // Skip authentication for development
  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading } = useQuery({
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

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/bots" component={Dashboard} />
      <Route path="/commands" component={Dashboard} />
      <Route path="/analytics" component={Dashboard} />
      <Route path="/settings" component={Dashboard} />
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
