'use client';

import { useState, useEffect, Suspense, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { SubmitButton } from '@/components/ui/submit-button';

// Form state type
type FormState = {
  success: boolean;
  error: string | null;
};

// Password validation helper
function validatePassword(pwd: string): string[] {
  const errors: string[] = [];
  if (pwd.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(pwd)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(pwd)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(pwd)) errors.push('One number');
  if (!/[@$!%*?&]/.test(pwd)) errors.push('One special character (@$!%*?&)');
  return errors;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Action for form submission
  const resetPasswordAction = async (
    prevState: FormState,
    formData: FormData
  ): Promise<FormState> => {
    const pwd = formData.get('password') as string;
    const confirm = formData.get('confirmPassword') as string;

    if (pwd !== confirm) {
      return { success: false, error: 'Passwords do not match' };
    }

    const errors = validatePassword(pwd);
    if (errors.length > 0) {
      return { success: false, error: 'Password does not meet requirements' };
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, error: null };
      } else {
        return { success: false, error: data.message || 'Failed to reset password' };
      }
    } catch {
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const [state, formAction] = useActionState(resetPasswordAction, {
    success: false,
    error: null,
  });

  // Handle password change for validation
  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    if (pwd) {
      setValidationErrors(validatePassword(pwd));
    } else {
      setValidationErrors([]);
    }
  };

  // Redirect to login after success
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  // Check for token
  useEffect(() => {
    if (!token) {
      // Token check is handled in render
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full">
                Request New Reset Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            {state.success ? 'Password reset successful!' : 'Enter your new password'}
          </CardDescription>
        </CardHeader>

        {state.success ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">Password Updated Successfully</p>
                <p className="text-sm text-muted-foreground">
                  You will be redirected to login in a moment...
                </p>
              </div>
            </div>
            <Link href="/login" className="w-full">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        ) : (
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && validationErrors.length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    <p className="text-muted-foreground">Password must contain:</p>
                    <ul className="space-y-1">
                      {validationErrors.map((err, idx) => (
                        <li key={idx} className="text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton
                className="w-full"
                pendingText="Resetting..."
                disabled={!password || !confirmPassword || validationErrors.length > 0}
              >
                Reset Password
              </SubmitButton>

              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
