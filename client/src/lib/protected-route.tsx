import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// This is a wrapper component that is rendered by Route
export function ProtectedRouteContent({
  path,
  Component,
}: {
  path: string;
  Component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  // Helper function to determine redirection based on user role and current path
  const getRedirectPath = () => {
    if (!user) return "/auth";
    
    const role = user.role;
    
    if (path === "/" || path === "") {
      // Redirect from home page to the appropriate dashboard
      if (role === "farmer") return "/farmer/dashboard";
      if (role === "buyer") return "/buyer/dashboard";
      if (role === "admin") return "/admin/dashboard";
    }
    
    // Check if trying to access a section they don't have permission for
    if (path.startsWith("/farmer/") && role !== "farmer" && role !== "admin") {
      if (role === "buyer") return "/buyer/dashboard";
      return "/auth";
    }
    
    if (path.startsWith("/buyer/") && role !== "buyer" && role !== "admin") {
      if (role === "farmer") return "/farmer/dashboard";
      return "/auth";
    }
    
    if (path.startsWith("/admin/") && role !== "admin") {
      if (role === "farmer") return "/farmer/dashboard";
      if (role === "buyer") return "/buyer/dashboard";
      return "/auth";
    }
    
    return null; // No redirection needed
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const redirectPath = getRedirectPath();
  if (redirectPath) {
    return <Redirect to={redirectPath} />;
  }

  return <Component />;
}

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  return (
    <Route path={path}>
      {() => <ProtectedRouteContent path={path} Component={Component} />}
    </Route>
  );
}
