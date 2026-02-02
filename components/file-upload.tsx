"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  acceptedTypes: string[]
  maxSize: number // in MB
}

export function FileUpload({ onFileSelect, acceptedTypes, maxSize }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        setUploadedFile(file)
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  })

  const removeFile = () => {
    setUploadedFile(null)
    onFileSelect(null)
  }

  if (uploadedFile) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="h-8 w-8 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div
      {...getRootProps({ tabIndex: 0 })}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        isDragActive && !isDragReject && "border-ring bg-accent",
        isDragReject && "border-destructive bg-destructive/10",
        !isDragActive && "border-border hover:border-ring",
      )}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      {isDragActive ? (
        <p className="text-primary">Drop your resume here...</p>
      ) : (
        <div className="space-y-2">
          <p className="text-foreground">Drag & drop your resume here, or click to browse</p>
          <p className="text-sm text-muted-foreground">
            Supports: {acceptedTypes.join(", ")} (Max {maxSize}MB)
          </p>
        </div>
      )}
    </div>
  )
}
