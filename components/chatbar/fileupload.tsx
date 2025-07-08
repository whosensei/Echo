import { useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { Paperclip, Upload, Check, Plus } from "lucide-react";
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
        className={`w-9 h-9 p-0 glass border-gray-200 dark:border-accent hover:bg-muted/50 transition-all duration-300 border rounded-full flex items-center justify-center focus-visible:ring-0 focus-visible:ring-offset-0 ${
          isDragActive ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : ""
        } ${isUploading ? "opacity-70 border-yellow-400 bg-yellow-50" : ""} ${
          showSuccess ? "border-green-400 bg-green-50 dark:bg-green-950/20" : ""
        }`}
        type="button"
        disabled={isUploading}
      >
        {showSuccess ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : isUploading ? (
          <Upload className="w-3 h-3 text-yellow-500 animate-pulse" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
};

export default FileUploader;
