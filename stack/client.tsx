import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  baseUrl: "https://api.stack-auth.com",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  tokenStore: "nextjs-cookie",
});
