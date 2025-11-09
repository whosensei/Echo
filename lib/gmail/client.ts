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

  if (!userAccount.length) {
    throw new Error("Google account not connected. Please sign in with Google.");
  }

  const accountData = userAccount[0];

  if (!accountData.refreshToken) {
    throw new Error("No refresh token available. Please reconnect your Google account in Settings.");
  }

  let accessToken = accountData.accessToken;
  let expiresAt = accountData.accessTokenExpiresAt;

  // Check if token is expired or about to expire (5 min buffer)
  const isExpired = !accessToken || (expiresAt && new Date(expiresAt).getTime() < Date.now() + 5 * 60 * 1000);

  if (isExpired) {
    try {
      console.log("Access token expired or missing, refreshing...");
      
      // Refresh the access token
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: accountData.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Token refresh failed:", error);
        throw new Error("Failed to refresh access token. Please reconnect your Google account in Settings.");
      }

      const tokens = await response.json();
      
      // Update database with new token
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date(),
        })
        .where(eq(account.id, accountData.id));

      // Use the new token
      accessToken = tokens.access_token;
      console.log("Access token refreshed successfully");
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Session expired. Please reconnect your Google account in Settings.");
    }
  }

  // Initialize OAuth2 client with valid token
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: accountData.refreshToken,
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
  recordingId: string,
  recipientEmail: string,
  recordingTitle: string,
  transcriptContent: string
): Promise<void> {
  try {
    const subject = `Transcript: ${recordingTitle}`;
    const body = `
Hello,

Please find attached the transcript for the recording: ${recordingTitle}

---
${transcriptContent}
---

Best regards,
Meeting Assistant
    `.trim();

    // Log email attempt
    await db.insert(emailLog).values({
      userId,
      recordingId,
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
      .where(eq(emailLog.recordingId, recordingId));
  } catch (error) {
    // Update log as failed
    await db
      .update(emailLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(emailLog.recordingId, recordingId));
    throw error;
  }
}

/**
 * Send summary via email
 */
export async function sendSummaryEmail(
  userId: string,
  recordingId: string,
  recipientEmail: string,
  recordingTitle: string,
  summary: string,
  actionPoints?: any[]
): Promise<void> {
  try {
    const subject = `Meeting Summary: ${recordingTitle}`;

    let actionPointsText = "";
    if (actionPoints && actionPoints.length > 0) {
      actionPointsText = "\n\nAction Points:\n" + actionPoints.map((point, idx) => `${idx + 1}. ${point}`).join("\n");
    }

    const body = `
Hello,

Here is the summary for the recording: ${recordingTitle}

Summary:
${summary}
${actionPointsText}

Best regards,
Meeting Assistant
    `.trim();

    // Log email attempt
    await db.insert(emailLog).values({
      userId,
      recordingId,
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
      .where(eq(emailLog.recordingId, recordingId));
  } catch (error) {
    // Update log as failed
    await db
      .update(emailLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(emailLog.recordingId, recordingId));
    throw error;
  }
}

/**
 * Send PDF via email
 */
export async function sendPDFEmail(
  userId: string,
  recordingId: string,
  recipientEmail: string,
  subject: string,
  message: string,
  pdfBase64: string,
  filename: string
): Promise<void> {
  try {
    // Log email attempt
    await db.insert(emailLog).values({
      userId,
      recordingId,
      recipientEmail,
      subject,
      type: "pdf",
      status: "pending",
    });

    await sendEmail(userId, {
      to: recipientEmail,
      subject,
      body: message,
      attachments: [
        {
          filename,
          content: pdfBase64,
          mimeType: "application/pdf",
        },
      ],
    });

    // Update log as sent
    await db
      .update(emailLog)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(emailLog.recordingId, recordingId));
  } catch (error) {
    // Update log as failed
    await db
      .update(emailLog)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(emailLog.recordingId, recordingId));
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
