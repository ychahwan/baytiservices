import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onFilesUpload: (urls: string[]) => void;
  existingFileUrls?: string[];
  onRemove?: (index: number) => void;
}

export function FileUpload({ onFilesUpload, existingFileUrls = [], onRemove }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (acceptedFiles.length + existingFileUrls.length > 3) {
        alert('You can upload a maximum of 3 files.');
        return;
      }

      setUploading(true);

      const uploadedUrls: string[] = [];

      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) { // 10MB size check
          alert(`File ${file.name} exceeds 10MB limit.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-provider-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert(`Error uploading ${file.name}`);
          continue;
        }

        const { data: publicUrlData, error: publicUrlError } = supabase.storage
          .from('service-provider-files')
          .getPublicUrl(uploadData.path);

        if (publicUrlError || !publicUrlData.publicUrl) {
          console.error('Public URL error:', publicUrlError);
          alert(`Error getting public URL for ${file.name}`);
          continue;
        }

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onFilesUpload([...existingFileUrls, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('General error uploading files:', error);
      alert('An error occurred while uploading files.');
    } finally {
      setUploading(false);
    }
  }, [existingFileUrls, onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 3 - existingFileUrls.length,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="space-y-4">
      {existingFileUrls.length > 0 && (
        <div className="space-y-2">
          {existingFileUrls.map((url, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 truncate w-4/5"
              >
                {url.split('/').pop()}
              </a>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {existingFileUrls.length < 3 && (
        <div
          {...getRootProps()}
          role="button"
          tabIndex={0}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400'}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-12 w-12 mx-auto text-indigo-500 animate-spin" />
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive ? 'Drop the file(s) here' : 'Drag & drop up to 3 files, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: PDF, DOC, DOCX, PNG, JPG (max 10MB each)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}