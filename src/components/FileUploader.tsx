import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { clsx } from "clsx";

interface FileUploaderProps {
  onUploadComplete?: (documentId: string) => void;
  className?: string;
}

export function FileUploader({ onUploadComplete, className }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [completedFiles, setCompletedFiles] = useState<Set<string>>(new Set());

  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const processPdfFile = useMutation(api.ingestion.pdfProcessor.processPdfFile);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (file.type !== "application/pdf") {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize progress tracking
    const newUploadingFiles = new Map();
    validFiles.forEach(file => {
      newUploadingFiles.set(file.name, 0);
    });
    setUploadingFiles(newUploadingFiles);

    for (const file of validFiles) {
      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file with progress tracking
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadingFiles(prev => new Map(prev).set(file.name, progress));
          }
        };

        // Handle upload completion
        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));

          xhr.open("POST", uploadUrl);
          xhr.send(formData);
        });

        // Get the file ID from response
        const result = JSON.parse(xhr.responseText);
        const fileId = result.storageId;

        // Process the PDF
        setUploadingFiles(prev => new Map(prev).set(file.name, -1)); // -1 indicates processing
        const documentId = await processPdfFile({
          fileId,
          title: file.name.replace(/\.pdf$/i, ""),
          isPublic: true,
        });

        // Mark as completed
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(file.name);
          return newMap;
        });

        setCompletedFiles(prev => new Set(prev).add(file.name));

        toast.success(`${file.name} processed successfully!`);
        onUploadComplete?.(documentId);

        // Remove from completed after delay
        setTimeout(() => {
          setCompletedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(file.name);
            return newSet;
          });
        }, 3000);

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);

        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(file.name);
          return newMap;
        });
      }
    }
  }, [generateUploadUrl, processPdfFile, onUploadComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Clear input value to allow re-uploading same file
    e.target.value = "";
  }, [handleFileUpload]);

  const isUploading = uploadingFiles.size > 0;

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={clsx(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : isUploading
            ? "border-orange-300 bg-orange-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="space-y-3">
          <div className={clsx(
            "text-4xl",
            isDragging ? "text-blue-500" : isUploading ? "text-orange-500" : "text-gray-400"
          )}>
            {isDragging ? "📁" : isUploading ? "⏳" : "📄"}
          </div>

          <div>
            <p className={clsx(
              "text-lg font-medium",
              isDragging ? "text-blue-700" : isUploading ? "text-orange-700" : "text-gray-700"
            )}>
              {isDragging
                ? "Drop your PDFs here"
                : isUploading
                ? "Processing files..."
                : "Upload PDFs"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isUploading
                ? "Please wait while we process your documents"
                : "Drag & drop PDF files here, or click to select"}
            </p>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>• Maximum file size: 10MB per PDF</p>
            <p>• Supported formats: PDF only</p>
            <p>• Files will be processed for AI chat context</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploading Files</h4>
          {Array.from(uploadingFiles.entries()).map(([fileName, progress]) => (
            <div key={fileName} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {fileName}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {progress === -1 ? "Processing..." : `${Math.round(progress)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={clsx(
                    "h-2 rounded-full transition-all duration-300",
                    progress === -1
                      ? "bg-orange-400 animate-pulse"
                      : "bg-blue-500"
                  )}
                  style={{
                    width: progress === -1 ? "100%" : `${progress}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Files */}
      {completedFiles.size > 0 && (
        <div className="space-y-3">
          {Array.from(completedFiles).map((fileName) => (
            <div key={fileName} className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="text-green-500 text-lg">✅</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{fileName}</p>
                  <p className="text-xs text-green-600">Successfully processed and ready for AI chat</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}