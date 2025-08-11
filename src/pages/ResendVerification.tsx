import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ResendVerification = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resendVerification } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await resendVerification(email);
      if (result.error) {
        setError(result.error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-900">
              Verification email sent
            </CardTitle>
            <CardDescription className="mt-2 text-gray-600">
              We've sent a new verification email to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-sm text-gray-600">
                  Please check your email and click the verification link. If you don't see it, check your spam folder.
                </p>
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-red-600 hover:text-red-500 font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-900">
            Resend verification email
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Enter your email address and we'll send you a new verification email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send verification email"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already verified?{" "}
                <Link
                  to="/login"
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResendVerification;
