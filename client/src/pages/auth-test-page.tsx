import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthTestPage() {
  const [message, setMessage] = useState<string | null>(null);

  const testAuth = async () => {
    try {
      const res = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (res.status === 401) {
        setMessage('Not authenticated. You need to login.');
        return;
      }
      
      if (!res.ok) {
        setMessage(`Error: ${res.status} - ${res.statusText}`);
        return;
      }
      
      const userData = await res.json();
      setMessage(`Authenticated as: ${userData.username} (${userData.role})`);
    } catch (error: any) {
      setMessage(`Error checking auth: ${error.message}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testAuth} className="w-full">
            Check Authentication Status
          </Button>
          
          {message && (
            <div className="p-4 border rounded-lg mt-4 bg-white">
              <p>{message}</p>
            </div>
          )}
          
          <div className="mt-6 space-y-2">
            <a href="/auth" className="text-blue-600 hover:underline block">
              Go to Login/Register Page
            </a>
            <a href="/" className="text-blue-600 hover:underline block">
              Go to Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}