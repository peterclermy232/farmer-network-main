import { Redirect } from "wouter";

// HomePage now acts as a simple redirect component
// The actual authentication check happens in the ProtectedRoute component
export default function HomePage() {
  return <Redirect to="/auth" />;
}
