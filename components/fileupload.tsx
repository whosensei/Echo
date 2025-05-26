import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Paperclip, Upload, Check } from 'lucide-react';
import { uploadToS3 } from '@/lib/uploadtoS3';

const FileUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    
    try {
      const file = acceptedFiles[0];
      const data = await uploadToS3(file);
      
      if (!data?.file_key || !data.file_name) {
        console.log("Something went wrong with the upload");
        return;
      }
      
      setUploadedFiles(prev => [...prev, data.file_name]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  }, []);

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
          uploadedFiles.length > 0 ? "border-green-400 bg-green-50 dark:bg-green-950/20" : ""
        }`}
        type="button"
        disabled={isUploading}
      >
        {uploadedFiles.length > 0 ? (
          <Check className="w-3 h-3 mr-1.5 text-green-600" />
        ) : isUploading ? (
          <Upload className="w-3 h-3 mr-1.5 animate-pulse" />
        ) : (
          <Paperclip className="w-3 h-3 mr-1.5" />
        )}
        {uploadedFiles.length > 0 
          ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`
          : isUploading 
            ? "Uploading..." 
            : "Attach"
        }
      </Button>
    </div>
  );
};

export default FileUploader;