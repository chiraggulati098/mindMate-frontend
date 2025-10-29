import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateToken } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/auth', { replace: true });
        return;
      }
      
      // Validate token with backend (optional)
      try {
        const isValid = await validateToken();
        if (!isValid) {
          localStorage.removeItem('token');
          navigate('/auth', { replace: true });
          return;
        }
        setIsAuthenticated(true);
      } catch {
        // If validation fails (e.g., no internet), just check if token exists
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;