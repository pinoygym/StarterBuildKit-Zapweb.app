'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re sorry, but something unexpected happened. Please try again.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-md">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="flex-1">
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
