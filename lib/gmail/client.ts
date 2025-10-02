import { google } from "googleapis";
import { db } from "../db";
import { account, emailLog } from "../db/schema";
import { eq } from "drizzle-orm";

interface EmailAttachment {
  filename: string;
  content: string;
  mimeType: string;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * Get Gmail client for a user
 */
export async function getGmailClient(userId: string) {
  // Get user's Google OAuth tokens from the database
  const userAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))
    .limit(1);

  if (!userAccount.length || !userAccount[0].accessToken) {
    throw new Error("Google account not connected or no access token found");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: userAccount[0].accessToken,
    refresh_token: userAccount[0].refreshToken,
    expiry_date: userAccount[0].accessTokenExpiresAt?.getTime(),
  });

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      // Update refresh token in database
      await db
        .update(account)
        .set({
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        })
        .where(eq(account.userId, userId));
    } else if (tokens.access_token) {
      // Update only access token
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : undefined,
        })
        .where(eq(account.userId, userId));
    }
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return gmail;
}

/**
 * Create email message in base64 format
 */
function createEmailMessage(params: SendEmailParams): string {
  const boundary = "boundary_" + Date.now();
  const recipients = Array.isArray(params.to) ? params.to.join(", ") : params.to;

  let message = [
    `To: ${recipients}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
  ];

  if (params.attachments && params.attachments.length > 0) {
    message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    message.push("");
    message.push(`--${boundary}`);
  }

  if (params.html) {
    message.push("Content-Type: text/html; charset=UTF-8");
  } else {
    message.push("Content-Type: text/plain; charset=UTF-8");
  }

  message.push("");
  message.push(params.html || params.body);

  // Add attachments
  if (params.attachments && params.attachments.length > 0) {
    for (const attachment of params.attachments) {
      message.push("");
      message.push(`--${boundary}`);
      message.push(
        `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`
      );
      message.push("Content-Transfer-Encoding: base64");
      message.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      message.push("");
      message.push(attachment.content);
    }
    message.push("");
    message.push(`--${boundary}--`);
  }

  const email = message.join("\r\n");
  return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Send email via Gmail API
 */
export async function sendEmail(userId: string, params: SendEmailParams): Promise<void> {
  try {
    const gmail = await getGmailClient(userId);

    const raw = createEmailMessage(params);

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Send transcript via email
 */
export async function sendTranscriptEmail(
  userId: string,
  meetingId: string,
  recipientEmail: string,
  meetingTitle: string,
  transcriptContent: string
): Promise<void> {
  try {
    const subject = `Transcript: ${meetingTitle}`;
    const body = `
Hello,

Please find attached the transcript for the meeting: ${meetingTitle}

---
${transcriptContent}
---

Best regards,
Meeting Assistant
    `.trim();

    // Log email attempt
    await db.insert(emailLog).values({
      userId,
      meetingId,
      recipientEmail,
      subject,
      type: "transcript",
      status: "pending",
    });

    await sendEmail(userId, {
      to: recipientEmail,
      subject,
      body,
    });

    // Update log as sent
    await db
      .update(emailLog)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailLog.meetingId, meetingId));
  } catch (error) {
    // Update log as failed
    await db
      .update(emailLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(emailLog.meetingId, meetingId));
    throw error;
  }
}

/**
 * Send summary via email
 */
export async function sendSummaryEmail(
  userId: string,
  meetingId: string,
  recipientEmail: string,
  meetingTitle: string,
  summary: string,
  actionPoints?: any[]
): Promise<void> {
  try {
    const subject = `Meeting Summary: ${meetingTitle}`;

    let actionPointsText = "";
    if (actionPoints && actionPoints.length > 0) {
      actionPointsText = "\n\nAction Points:\n" + actionPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n");
    }

    const body = `
Hello,

Here is the summary for the meeting: ${meetingTitle}

Summary:
${summary}
${actionPointsText}

Best regards,
Meeting Assistant
    `.trim();

    // Log email attempt
    await db.insert(emailLog).values({
      userId,
      meetingId,
      recipientEmail,
      subject,
      type: "summary",
      status: "pending",
    });

    await sendEmail(userId, {
      to: recipientEmail,
      subject,
      body,
    });

    // Update log as sent
    await db
      .update(emailLog)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailLog.meetingId, meetingId));
  } catch (error) {
    // Update log as failed
    await db
      .update(emailLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(emailLog.meetingId, meetingId));
    throw error;
  }
}

/**
 * Check if user has Gmail connected
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
  const userAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId))
    .limit(1);

  return userAccount.length > 0 && !!userAccount[0].accessToken;
}
