import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signup, login } from "@/lib/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOTP, setIsOTP] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <Link to="/" className="flex items-center justify-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <img src="/logo.png" alt="MindMate" className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">MindMate</span>
          </Link>
          <div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access your account"
                : "Sign up to start your learning journey"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                if (!isLogin) {
                  // Signup
                  const resp = await signup({ name, email, password });
                  if (resp.token) {
                    localStorage.setItem("auth_token", resp.token);
                    navigate("/dashboard");
                  } else {
                    setError(resp.message || "Signup succeeded but no token returned");
                  }
                } else {
                  // Login
                  if (isOTP) {
                    // Backend OTP flow not implemented in API helper; keep placeholder.
                    setError("OTP login is not supported yet.");
                  } else {
                    const resp = await login({ email, password });
                    if (resp.token) {
                      localStorage.setItem("auth_token", resp.token);
                      navigate("/dashboard");
                    } else {
                      setError(resp.message || "Login succeeded but no token returned");
                    }
                  }
                }
              } catch (err: any) {
                setError(err.message || "Something went wrong");
              } finally {
                setLoading(false);
              }
            }}
          >
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="transition-all focus:ring-2 focus:ring-primary"
              />
            </div>

            {!isOTP && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {isOTP && (
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (isLogin ? "Signing in..." : "Signing up...") : isLogin ? "Sign in" : "Sign up"}
            </Button>

            {isLogin && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsOTP(!isOTP)}
                disabled={loading}
              >
                {isOTP ? "Use Password" : "Login with OTP"}
              </Button>
            )}
          </form>

          <div className="text-center text-sm">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
