import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onFileUpload: (url: string) => void;
  existingFileUrl?: string;
  onRemove?: () => void;
}

export function FileUpload({ onFileUpload, existingFileUrl, onRemove }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const file = acceptedFiles[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('service-provider-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('service-provider-files')
          .getPublicUrl(data.path);

        onFileUpload(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="space-y-4">
      {existingFileUrl ? (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <a 
            href={existingFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
          >
            View Uploaded File
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400'}`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: PDF, DOC, DOCX, PNG, JPG (max 10MB)
          </p>
        </div>
      )}
    </div>
  );
}