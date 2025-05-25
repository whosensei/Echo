import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
    
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey:process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});


export async function downloadFromS3(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const params = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      };

      const command = new GetObjectCommand(params);
      const response = await s3Client.send(command);
      
      const tmpDir = "/tmp";
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      const file_name = path.join(tmpDir, `dips${Date.now().toString()}.pdf`);
      
      if (response.Body instanceof Readable) {
        const writeStream = fs.createWriteStream(file_name);
        
        writeStream.on("finish", () => {
          resolve(file_name);
        });
        
        response.Body.pipe(writeStream);
      } else {
        // @ts-ignore: Body may be any type of data
        const responseBodyBuffer = await response.Body?.transformToByteArray();
        if (responseBodyBuffer) {
          fs.writeFileSync(file_name, Buffer.from(responseBodyBuffer));
          resolve(file_name);
        } else {
          reject(new Error("Failed to transform response body to buffer"));
        }
      }
    } catch (error) {
      console.error("Error downloading from S3:", error);
      reject(error);
    }
  });
}