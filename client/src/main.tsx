import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";

// Define our emergency handler if React errors out
window.addEventListener('error', (event) => {
  if (event.message.includes('useAuth') && 
      event.message.includes('within an AuthProvider')) {
    
    // If we get an auth error, render an emergency page
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
          <h1 style="font-size: 24px; margin-bottom: 20px;">Authentication System Error</h1>
          <p style="margin-bottom: 20px;">There was a problem with the authentication system.</p>
          <div>
            <a href="/auth" style="background-color: #0ea5e9; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; margin-right: 10px;">
              Go to Login
            </a>
            <a href="/" style="background-color: #64748b; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">
              Go to Home
            </a>
          </div>
        </div>
      `;
    }
  }
});

const root = createRoot(document.getElementById("root")!);

// Start the app with all the providers
root.render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <App />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
