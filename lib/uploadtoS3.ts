import axios from "axios";

export async function uploadToS3Presigned(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  try {

    const data = {
      filename: file.name,
      file_type: file.type
    }

    const presignedresponse = await axios.post("/api/presign", data, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if(!presignedresponse.data){
      throw new Error("Failed to get presigned URL");
    }

    const {url,file_key,file_name} = presignedresponse.data

    const uploadResponse = await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      }
    });

    if(uploadResponse.status !== 200){
      throw new Error("Failed to upload to S3")
    }
    
    return {
      file_key,
      file_name: file.name,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${file_key}`;
  return url;
}