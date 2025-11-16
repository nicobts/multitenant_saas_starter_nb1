"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageIcon, X, Upload } from "lucide-react";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  onImageSelect: (images: string[]) => void;
  onImageRemove?: (index: number) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  maxImages = 4,
  className,
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Check if adding these files would exceed maxImages
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Convert files to base64
    const base64Images = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    const newImages = [...images, ...base64Images];
    setImages(newImages);
    onImageSelect(newImages);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImageSelect(newImages);
    onImageRemove?.(index);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Button */}
      {images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image{maxImages > 1 && "s"} ({images.length}/{maxImages})
          </Button>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <Card
              key={index}
              className="relative aspect-square overflow-hidden group"
            >
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Help Text */}
      {images.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Upload images to use with vision models
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports JPEG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}
