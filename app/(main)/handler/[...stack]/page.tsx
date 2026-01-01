import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

export default function Handler({ params, searchParams }: { params: { stack?: string[] }; searchParams: Record<string, string> }) {
  return <StackHandler app={stackServerApp} params={params} searchParams={searchParams} fullPage />;
}
