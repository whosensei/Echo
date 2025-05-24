import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Paperclip } from 'lucide-react';
import { any } from 'zod/v4';

const FileUploader = () => {

   const onDrop = useCallback((acceptedFiles:File[])=> {
    // Do something with the files
    console.log(acceptedFiles)
  }, [])

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