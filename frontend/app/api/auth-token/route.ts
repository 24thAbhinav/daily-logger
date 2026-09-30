import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * GET /api/auth-token
 * Server-side route that retrieves the Clerk session JWT and returns it
 * to the client-side API wrapper so it can authenticate backend requests.
 */
export async function GET() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }
    return NextResponse.json({ token }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }
}
