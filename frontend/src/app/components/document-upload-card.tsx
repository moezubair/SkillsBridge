import { useRef, useState } from "react";
import { Upload, X, FileCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DocumentUploadCardProps {
  title: string;
  description: string;
  helperText?: string;
  icon?: LucideIcon;
  acceptedTypes?: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  compact?: boolean;
}

export function DocumentUploadCard({
  title,
  description,
  helperText,
  icon: Icon = Upload,
  acceptedTypes = ".pdf,.jpg,.jpeg,.png",
  file,
  onFileSelect,
  onRemove,
  compact = false,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelect(droppedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
  };

  if (file) {
    return (
      <div
        className={`bg-white rounded-lg border border-primary/20 ${compact ? "p-4" : "p-6"} flex items-center gap-3`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`bg-white rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        isDragging
          ? "border-primary/60 bg-primary/5"
          : "border-gray-300 hover:border-primary/40"
      } ${compact ? "p-4 text-center" : "p-8 text-center"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      <Icon
        className={`mx-auto mb-2 text-gray-400 ${compact ? "w-8 h-8" : "w-12 h-12 mb-4"}`}
      />
      <h3
        className={`font-semibold text-gray-900 ${compact ? "text-sm mb-1" : "mb-2"}`}
      >
        {title}
      </h3>
      <p className={`text-gray-600 ${compact ? "text-xs" : "text-sm mb-4"}`}>
        {description}
      </p>
      {!compact && (
        <span className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
          Choose File
        </span>
      )}
      {helperText && (
        <p className={`text-gray-500 ${compact ? "text-xs mt-1" : "text-xs mt-4"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
