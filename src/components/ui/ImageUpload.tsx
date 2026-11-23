"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Product Image",
  helperText = "PNG, JPG or WEBP (Max 25MB)",
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);

    // 1. Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // 2. Validate file size (under 25MB limit)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(`Image is too large (${sizeInMb}MB). Must be under 25MB.`);
      return;
    }

    // 3. Upload to /api/upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        onChange(data.url);
      } else {
        setErrorMessage(data.message || "Failed to upload image. Please try again.");
      }
    } catch {
      setErrorMessage("Network error during upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 text-xs block">{label}</label>
          <span className="text-[10px] text-slate-500 font-medium">{helperText}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box */
        <div className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-3 shadow-2xs">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
            <Image
              src={value}
              alt="Uploaded preview"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {value.split("/").pop()}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
              <span>●</span> Ready for product
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-red-600 hover:text-red-700 font-bold underline mt-1 block"
            >
              Change Image
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600 flex items-center justify-center transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Dropzone / Upload Box */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? "border-red-500 bg-red-50/50"
              : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/80 hover:border-red-400"
          }`}
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center gap-2 text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
              <span className="text-xs font-semibold">Uploading & optimizing image...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                {dragActive ? (
                  <ImageIcon className="w-5 h-5 text-red-600" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-red-600 font-bold hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Direct image file (Under 25MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-red-600 font-bold pt-0.5">{errorMessage}</p>
      )}
    </div>
  );
}

