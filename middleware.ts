import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporary pass-through middleware to unblock build
// StackMiddleware was not found in the installed @stackframe/stack package
export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
