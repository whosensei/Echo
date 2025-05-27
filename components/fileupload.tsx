import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Paperclip, Upload, Check } from 'lucide-react';
import { uploadToS3 } from '@/lib/uploadtoS3';

export interface UploadedFile {
  file_key: string;
  file_name: string;
  file_url?: string;
  preview_url?: string;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesUploaded, 
  isUploading, 
  setIsUploading 
}) => {
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
        
        const data = await uploadToS3(file);
        
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noKeyboard: true,
    accept: { 'image/*': [] },
    multiple: true,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button
        variant="outline"
        size="sm"
        className={`text-sm glass border-border/30 hover:bg-muted/50 transition-all duration-300 ${
          isDragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : ""
        } ${isUploading ? "opacity-70" : ""} ${
          showSuccess ? "border-green-400 bg-green-50 dark:bg-green-950/20" : ""
        }`}
        type="button"
        disabled={isUploading}
      >
        {showSuccess ? (
          <Check className="w-3 h-3 mr-1.5 text-green-600" />
        ) : isUploading ? (
          <Upload className="w-3 h-3 mr-1.5 animate-pulse" />
        ) : (
          <Paperclip className="w-3 h-3 mr-1.5" />
        )}
        {isUploading 
          ? "Uploading..." 
          : "Attach"
        }
      </Button>
    </div>
  );
};

export default FileUploader;