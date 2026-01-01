'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const [cookieInfo, setCookieInfo] = useState('');
  const [apiTest, setApiTest] = useState('');

  useEffect(() => {
    // Check cookies
    setCookieInfo(document.cookie || 'No cookies found');

    // Test API call
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setApiTest(JSON.stringify(data, null, 2)))
      .catch(err => setApiTest('Error: ' + err.message));
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Browser Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {cookieInfo}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>/api/auth/me Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {apiTest}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
