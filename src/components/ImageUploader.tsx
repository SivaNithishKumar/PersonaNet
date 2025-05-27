"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
  maxFileSizeMB?: number;
}

export function ImageUploader({ onImageUpload, maxFileSizeMB = 5 }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `Please upload an image smaller than ${maxFileSizeMB}MB.`,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file (e.g., JPG, PNG).",
        });
        return;
      }
      
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        onImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, maxFileSizeMB, toast]);

  const handleRemoveImage = useCallback(() => {
    setPreviewUrl(null);
    setFileName(null);
    onImageUpload(''); // Notify parent that image is removed
    // Reset file input value
    const fileInput = document.getElementById('user-image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [onImageUpload]);

  return (
    <div className="w-full space-y-4">
      <div 
        className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors"
        onClick={() => document.getElementById('user-image-upload')?.click()}
        onKeyDown={(e) => e.key === 'Enter' && document.getElementById('user-image-upload')?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload your image"
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt="Uploaded preview" layout="fill" objectFit="contain" className="rounded-lg p-2" data-ai-hint="person portrait"/>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 right-2 z-10" 
              onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
              aria-label="Remove image"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-10 h-10 mb-3 text-primary" />
            <p className="mb-2 text-sm text-foreground/80">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {maxFileSizeMB}MB</p>
          </div>
        )}
        <Input
          id="user-image-upload"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
          onChange={handleFileChange}
        />
      </div>
      {fileName && !previewUrl && ( // Show filename if upload fails but file was selected
         <p className="text-sm text-muted-foreground text-center">Selected: {fileName}</p>
      )}
    </div>
  );
}
