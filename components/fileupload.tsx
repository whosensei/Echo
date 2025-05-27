import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Paperclip, Upload, Check } from "lucide-react";
import { UploadedFile, useFileUploader } from "@/lib/hooks/useFileUploader";

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  const { onDrop, isUploading, showSuccess } = useFileUploader(onFilesUploaded);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noKeyboard: true,
    accept: { "image/*": [] },
    multiple: true,
    maxFiles:5,
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
        {isUploading ? "Uploading..." : "Attach"}
      </Button>
    </div>
  );
};

export default FileUploader;
