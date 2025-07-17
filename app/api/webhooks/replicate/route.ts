import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { versions, images, chats, predictions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function downloadAndUploadImage(imageUrl: string, versionID: string, userID: string, chatID: string, prompt: string, predictionID: number,model:string) {
    try {
        // Download image from Replicate
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
        
        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${userID}-${versionID}-${timestamp}.png`;
        
        // Upload to S3 using AWS SDK
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        
        const s3Client = new S3Client({
            region: process.env.NEXT_PUBLIC_AWS_REGION!,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
        
        const uploadParams = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: filename,
            Body: buffer,
            ContentType: 'image/png',
        };
        
        await s3Client.send(new PutObjectCommand(uploadParams));
        
        // Construct S3 URL
        const s3Url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${filename}`;
        
        // Save to images table
        await db.insert(images).values({
            versionID: parseInt(versionID),
            userID: userID,
            chatID: parseInt(chatID),
            imageUrl: s3Url,
            prompt: prompt,
            model: model,
            visibility: 'private',
            predictionID: predictionID
        });
        
        return s3Url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("webhook-signature");
        const timestamp = req.headers.get("webhook-timestamp");
        
        // Verify webhook signature if secret is provided
        if (process.env.REPLICATE_WEBHOOK_SIGNING_SECRET) {
            if (!signature || !timestamp) {
                return NextResponse.json({ error: "Missing signature or timestamp" }, { status: 401 });
            }
            
            const expectedSignature = crypto
                .createHmac("sha256", process.env.REPLICATE_WEBHOOK_SIGNING_SECRET)
                .update(timestamp + "." + body)
                .digest("hex");
                
            if (signature !== expectedSignature) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }
        
        const prediction = JSON.parse(body);
        const url = new URL(req.url);
        const versionID = url.searchParams.get("versionID");
        const model = url.searchParams.get("model");
        
        if (!versionID) {
            return NextResponse.json({ error: "Missing versionID" }, { status: 400 });
        }
        
        // Find the prediction record by replicateID
        const predictionRecord = await db.select({
            predictionID: predictions.predictionID,
            versionID: predictions.versionID,
        }).from(predictions)
        .where(eq(predictions.replicateID, prediction.id))
        .limit(1);
        
        if (!predictionRecord.length) {
            return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
        }
        
        const { predictionID } = predictionRecord[0];
        
        // Get version info with userID from chats table
        const version = await db.select({
            userID: chats.userID,
            chatID: versions.chatID,
            prompt: versions.prompt
        }).from(versions)
        .innerJoin(chats, eq(versions.chatID, chats.chatID))
        .where(eq(versions.versionID, parseInt(versionID)))
        .limit(1);
        
        if (!version.length) {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }
        
        const { userID, chatID, prompt } = version[0];
        
        // Update the prediction record
        const updateData: any = {
            status: prediction.status,
            updatedAt: new Date(),
        };
        
        // Handle successful prediction - download and store images
        if (prediction.status === "succeeded" && prediction.output) {
            updateData.output = JSON.stringify(prediction.output);
            
            // If output is an array of image URLs, process each one
            if (Array.isArray(prediction.output)) {
                for (const imageUrl of prediction.output) {
                    if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                        await downloadAndUploadImage(imageUrl, versionID, userID, chatID.toString(), prompt || '', predictionID, model || '');
                    }
                }
            } 
            // If output is a single image URL
            else if (typeof prediction.output === 'string' && prediction.output.startsWith('http')) {
                await downloadAndUploadImage(prediction.output, versionID, userID, chatID.toString(), prompt || '', predictionID, model || '');
            }
        }
        
        // Add error if prediction failed
        if (prediction.status === "failed" && prediction.error) {
            updateData.error = prediction.error;
        }
        
        await db
            .update(predictions)
            .set(updateData)
            .where(eq(predictions.predictionID, predictionID));
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}