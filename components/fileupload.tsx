import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Paperclip } from 'lucide-react';
import axios from 'axios';
import { uploadToS3 } from '@/lib/uploadtoS3';

const FileUploader = () => {

   const onDrop = useCallback(async (acceptedFiles: File[]) => {

      console.log(acceptedFiles);
      const file = acceptedFiles[0];
      const data = await uploadToS3(file)
      if (!data?.file_key || !data.file_name) {
        console.log("Something went wrong with the upload")
        return
      }
      console.log(data)
  }, []);

    const { getRootProps, getInputProps } = useDropzone({
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
                size="icon"
                className="rounded-full h-9 w-9 p-0"
                type="button"
            >
                <span className="sr-only">Attach File</span>
                <Paperclip className="w-4 h-4" />
            </Button>
        </div>
    );
};

export default FileUploader;