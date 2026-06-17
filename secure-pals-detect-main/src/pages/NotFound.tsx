import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <Shield className="h-16 w-16 text-primary mb-6 opacity-50" />
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">This page doesn't exist in our system.</p>
      <Button asChild className="glow-cyan">
        <Link to="/">Return to Home</Link>
      </Button>
    </div>
  );
};

export default NotFound;
