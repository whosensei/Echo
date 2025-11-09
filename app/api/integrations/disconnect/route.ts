import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST() {
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

    if (!googleAccount) {
      return NextResponse.json(
        { error: "No Google account connected" },
        { status: 404 }
      );
    }

    // Revoke Google token
    if (googleAccount.accessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${googleAccount.accessToken}`,
          { method: "POST" }
        );
      } catch (error) {
        console.error("Failed to revoke Google token:", error);
        // Continue anyway to delete from database
      }
    }

    // Delete account from database
    await db
      .delete(account)
      .where(eq(account.id, googleAccount.id));

    return NextResponse.json({
      success: true,
      message: "Google account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Google account:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google account" },
      { status: 500 }
    );
  }
}
