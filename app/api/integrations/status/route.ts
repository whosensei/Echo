import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Google account
    const googleAccount = await db.query.account.findFirst({
      where: and(
        eq(account.userId, session.user.id),
        eq(account.providerId, "google")
      ),
    });

    // Check if account exists and has valid tokens
    const isConnected = !!(
      googleAccount && 
      googleAccount.refreshToken
    );

    // Check individual scopes
    const hasGmailAccess = googleAccount?.scope?.includes("gmail.send") ?? false;
    const hasCalendarAccess = googleAccount?.scope?.includes("calendar.readonly") ?? false;

    // Check if tokens might be expired (this is approximate)
    const tokenMightBeExpired = googleAccount?.accessTokenExpiresAt 
      ? new Date(googleAccount.accessTokenExpiresAt).getTime() < Date.now()
      : true;

    return NextResponse.json({
      isConnected,
      hasGmailAccess,
      hasCalendarAccess,
      tokenMightBeExpired,
      email: session.user.email,
      scopes: googleAccount?.scope ? googleAccount.scope.split(" ") : [],
    });
  } catch (error) {
    console.error("Error checking integration status:", error);
    return NextResponse.json(
      { error: "Failed to check integration status" },
      { status: 500 }
    );
  }
}
