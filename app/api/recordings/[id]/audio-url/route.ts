import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recording } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { S3Service } from "@/lib/s3-service";
import { decryptPassword } from "@/lib/password-encryption";

// GET /api/recordings/[id]/audio-url - Get presigned URL for audio file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recordingId = params.id;

    // Fetch the recording
    const [recordingData] = await db
      .select()
      .from(recording)
      .where(
        and(eq(recording.id, recordingId), eq(recording.userId, session.user.id))
      );

    if (!recordingData) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    const audioFileUrl = recordingData.audioFileUrl;
    console.log("[AudioURL API] Received audioFileUrl:", audioFileUrl);

    // Check if it's already a full URL or a file key
    let fileKey: string;
    
    if (audioFileUrl.startsWith("http://") || audioFileUrl.startsWith("https://")) {
      // Extract file key from S3 URL
      try {
        const url = new URL(audioFileUrl);
        // Handle both path-style and virtual-hosted-style URLs
        // url.pathname is already URL-decoded by the URL constructor
        // But we need to make sure we're using it correctly
        let pathname = url.pathname;
        // Remove leading slash if present
        if (pathname.startsWith("/")) {
          pathname = pathname.substring(1);
        }
        // Decode the pathname to handle URL-encoded characters properly
        // Note: decodeURIComponent handles %20, %2F, etc.
        try {
          fileKey = decodeURIComponent(pathname);
        } catch (decodeError) {
          // If decoding fails, use the pathname as-is
          console.warn("[AudioURL API] Failed to decode pathname, using as-is:", decodeError);
          fileKey = pathname;
        }
        console.log("[AudioURL API] Extracted fileKey from URL (decoded):", fileKey);
        console.log("[AudioURL API] Original pathname:", url.pathname);
      } catch (error) {
        console.error("[AudioURL API] URL parsing error:", error);
        // If URL parsing fails, try to extract key using S3Service helper
        const extractedKey = S3Service.extractFileKeyFromUrl(audioFileUrl);
        if (!extractedKey) {
          console.error("[AudioURL API] Failed to extract file key");
          return NextResponse.json(
            { error: "Invalid audio file URL format", details: audioFileUrl },
            { status: 400 }
          );
        }
        // Try to decode the extracted key as well
        try {
          fileKey = decodeURIComponent(extractedKey);
        } catch (decodeError) {
          fileKey = extractedKey;
        }
        console.log("[AudioURL API] Extracted fileKey using helper:", fileKey);
      }
    } else {
      // It's already a file key - might be URL-encoded or not
      // Try decoding it, but if it fails, use as-is
      try {
        fileKey = decodeURIComponent(audioFileUrl);
      } catch (decodeError) {
        fileKey = audioFileUrl;
      }
      console.log("[AudioURL API] Using audioFileUrl as fileKey:", fileKey);
    }

    // Verify file exists in S3 before generating presigned URL
    console.log("[AudioURL API] Verifying file exists in S3 for fileKey:", fileKey);
    console.log("[AudioURL API] FileKey length:", fileKey.length);
    console.log("[AudioURL API] FileKey bytes:", Buffer.from(fileKey).toString('hex'));
    const s3Service = new S3Service();
    
    // Try multiple variations of the file key
    const keyVariations = [
      fileKey, // Original decoded key
      audioFileUrl.includes('http') ? new URL(audioFileUrl).pathname.substring(1) : fileKey, // Raw pathname
    ];
    
    // If original URL had encoded characters, try those variations
    if (audioFileUrl.includes('%')) {
      try {
        const url = new URL(audioFileUrl);
        // Get the raw pathname before any decoding
        const rawPath = url.pathname;
        keyVariations.push(rawPath.startsWith('/') ? rawPath.substring(1) : rawPath);
        // Also try encoding spaces as %20
        keyVariations.push(fileKey.replace(/ /g, '%20'));
        // Try encoding all special characters
        keyVariations.push(encodeURIComponent(fileKey).replace(/%2F/g, '/'));
      } catch (e) {
        // Ignore
      }
    }
    
    let foundKey: string | null = null;
    for (const keyVar of keyVariations) {
      try {
        console.log("[AudioURL API] Checking key variation:", keyVar);
        const exists = await s3Service.fileExists(keyVar);
        if (exists) {
          console.log("[AudioURL API] Found file with key:", keyVar);
          foundKey = keyVar;
          break;
        }
      } catch (checkError) {
        console.log("[AudioURL API] Error checking key variation:", keyVar, checkError);
      }
    }
    
    if (foundKey) {
      fileKey = foundKey;
    } else {
      console.error("[AudioURL API] File not found with any key variation");
      // Continue anyway - might be a permissions issue, but presigned URL might still work
      console.warn("[AudioURL API] Proceeding with original fileKey:", fileKey);
    }

    // Generate presigned download URL (valid for 1 hour)
    console.log("[AudioURL API] Generating presigned URL for fileKey:", fileKey);
    const presignedUrl = await s3Service.generatePresignedDownloadUrl(fileKey, 3600);
    console.log("[AudioURL API] Generated presigned URL:", presignedUrl ? "Success" : "Failed");

    // Decrypt password if encrypted file
    let decryptedPassword = null;
    if (recordingData.isEncrypted && recordingData.encryptedPassword) {
      try {
        decryptedPassword = decryptPassword(recordingData.encryptedPassword);
      } catch (error) {
        console.error("[AudioURL API] Failed to decrypt password:", error);
        // Continue without password - client will handle error
      }
    }

    return NextResponse.json({
      audioUrl: presignedUrl,
      expiresIn: 3600,
      // Include encryption metadata for client-side decryption
      isEncrypted: recordingData.isEncrypted || false,
      encryptionIV: recordingData.encryptionIV || null,
      encryptionSalt: recordingData.encryptionSalt || null,
      // Include decrypted password for client (only if encrypted)
      encryptionPassword: decryptedPassword,
    });
  } catch (error) {
    console.error("[AudioURL API] Error generating presigned audio URL:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate audio URL",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

