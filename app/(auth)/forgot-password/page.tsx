'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SubmitButton } from '@/components/ui/submit-button';

// Form state type
type FormState = {
  success: boolean;
  error: string | null;
  email: string | null;
};

// Server action for forgot password
async function forgotPasswordAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get('email') as string;

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, error: null, email };
    } else {
      return { success: false, error: data.message || 'Failed to send reset email', email: null };
    }
  } catch {
    return { success: false, error: 'An unexpected error occurred. Please try again.', email: null };
  }
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, {
    success: false,
    error: null,
    email: null,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            {state.success
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset link'
            }
          </CardDescription>
        </CardHeader>

        {state.success ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a password reset link to
                </p>
                <p className="font-medium">{state.email}</p>
                <p className="text-sm text-muted-foreground">
                  The link will expire in 1 hour.
                </p>
              </div>
            </div>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
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
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <SubmitButton className="w-full" pendingText="Sending...">
                Send Reset Link
              </SubmitButton>

              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
