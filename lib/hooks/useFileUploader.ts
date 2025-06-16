import { useState, useEffect, useCallback} from "react";
import { uploadToS3Presigned } from "../uploadtoS3";

export interface UploadedFile {
    file_key: string;
    file_name: string;
    file_url?: string;
    preview_url?: string;
  }

export function useFileUploader(onFilesUploaded: (files: UploadedFile[]) => void){
    const [isUploading , setIsUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (showSuccess) {
          const timer = setTimeout(() => {
            setShowSuccess(false);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }, [showSuccess]);
    
      const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        
        try {
          const uploadPromises = acceptedFiles.map(async (file) => {
            const preview_url = file.type.startsWith('image/') 
              ? URL.createObjectURL(file)
              : undefined;
            
            const data = await uploadToS3Presigned(file);
            
            if (!data?.file_key || !data.file_name) {
              console.log("Something went wrong with the upload");
              return null;
            }
    
            return {
              file_key: data.file_key,
              file_name: data.file_name,
              preview_url
            } as UploadedFile;
          });
    
          const results = await Promise.all(uploadPromises);
          const successfulUploads = results.filter((result): result is UploadedFile => result !== null);
          
          if (successfulUploads.length > 0) {
            onFilesUploaded(successfulUploads);
            setShowSuccess(true);
          }
        } catch (error) {
          console.error("Upload failed:", error);
        } finally {
          setIsUploading(false);
        }
      }, [onFilesUploaded, setIsUploading]);
 
      return{
        onDrop,
        isUploading,
        showSuccess,
        setIsUploading
      }
}