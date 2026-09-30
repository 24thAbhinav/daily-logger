import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
