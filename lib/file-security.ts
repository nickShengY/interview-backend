/**
 * File security utilities for upload validation
 * Implements magic byte verification and security checks
 */

// Magic byte signatures for allowed file types
const FILE_SIGNATURES = {
  PDF: {
    bytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    offset: 0,
    mimeTypes: ['application/pdf', 'application/octet-stream'],
  },
  DOCX: {
    bytes: [0x50, 0x4b, 0x03, 0x04], // PK (ZIP archive - DOCX is zipped XML)
    offset: 0,
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ],
  },
  DOC: {
    bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // Microsoft Office binary
    offset: 0,
    mimeTypes: ['application/msword', 'application/octet-stream'],
  },
  TXT: {
    // Text files don't have magic bytes - validate by content
    bytes: [],
    offset: 0,
    mimeTypes: ['text/plain'],
  },
  MARKDOWN: {
    bytes: [],
    offset: 0,
    mimeTypes: ['text/markdown', 'text/plain'],
  },
} as const

type FileType = keyof typeof FILE_SIGNATURES

export interface FileValidationResult {
  valid: boolean
  fileType?: FileType
  error?: string
  warnings?: string[]
}

/**
 * Verify file magic bytes match expected signature
 */
function verifyMagicBytes(buffer: ArrayBuffer, expectedBytes: readonly number[], offset = 0): boolean {
  if (expectedBytes.length === 0) return true // No magic bytes to check (e.g., TXT files)

  const bytes = new Uint8Array(buffer)
  if (bytes.length < offset + expectedBytes.length) return false

  for (let i = 0; i < expectedBytes.length; i++) {
    if (bytes[offset + i] !== expectedBytes[i]) return false
  }

  return true
}

/**
 * Detect actual file type from magic bytes
 */
function detectFileType(buffer: ArrayBuffer): FileType | null {
  const bytes = new Uint8Array(buffer)

  // Check PDF
  if (verifyMagicBytes(buffer, FILE_SIGNATURES.PDF.bytes, FILE_SIGNATURES.PDF.offset)) {
    return 'PDF'
  }

  // Check DOCX (PK signature)
  if (verifyMagicBytes(buffer, FILE_SIGNATURES.DOCX.bytes, FILE_SIGNATURES.DOCX.offset)) {
    // Additional check: DOCX should have specific ZIP structure
    // For now, accept any PK archive with .docx extension
    return 'DOCX'
  }

  // Check DOC (Microsoft Office binary)
  if (verifyMagicBytes(buffer, FILE_SIGNATURES.DOC.bytes, FILE_SIGNATURES.DOC.offset)) {
    return 'DOC'
  }

  // Check if it's likely text (all printable ASCII or UTF-8)
  if (isLikelyTextFile(bytes)) {
    return 'TXT'
  }

  return null
}

async function readBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer()
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(blob)
    })
  }

  throw new Error('File reading is not supported in this environment')
}

/**
 * Check if buffer contains mostly printable text
 */
function isLikelyTextFile(bytes: Uint8Array, sampleSize = 1024): boolean {
  const sample = bytes.slice(0, Math.min(sampleSize, bytes.length))
  let printableCount = 0

  for (const byte of sample) {
    // Printable ASCII (32-126), newlines (10, 13), tabs (9)
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      printableCount++
    } else if (byte > 127) {
      // UTF-8 multibyte characters - acceptable
      printableCount++
    }
  }

  // At least 95% printable characters
  return printableCount / sample.length > 0.95
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = filename.split(/[\\/]/).pop() || 'file'

  // Remove or replace dangerous characters
  const safe = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric (except . _ -)
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255) // Limit length

  // Ensure we have a filename
  return safe || 'file'
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

/**
 * Comprehensive file validation with security checks
 */
export async function validateFile(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: FileType[]
    strictMimeType?: boolean
  } = {}
): Promise<FileValidationResult> {
  const { maxSize = 50 * 1024 * 1024, allowedTypes = ['PDF', 'DOCX', 'DOC', 'TXT', 'MARKDOWN'], strictMimeType = false } = options

  const warnings: string[] = []

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    }
  }

  // Get file extension and MIME type
  const rawExtension = getFileExtension(file.name)
  const normalizedExtension = rawExtension.toUpperCase()
  const extension = (normalizedExtension === 'MD' ? 'MARKDOWN' : normalizedExtension) as FileType
  const mimeType = file.type

  // Check if extension is allowed
  if (!allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type: .${extension.toLowerCase()}. Allowed: ${allowedTypes.map((t) => `.${t.toLowerCase()}`).join(', ')}`,
    }
  }

  // Read first 8KB for magic byte verification
  const slice = typeof file.slice === 'function' ? file.slice(0, 8192) : file
  const buffer = await readBlobArrayBuffer(slice)

  // Detect actual file type from magic bytes
  const detectedType = detectFileType(buffer)

  // Verify magic bytes match claimed extension (for binary formats)
  if (extension !== 'TXT' && extension !== 'MARKDOWN') {
    if (!detectedType) {
      return {
        valid: false,
        error: 'File content does not match claimed file type (corrupted or invalid file)',
      }
    }

    // Special handling for DOCX (it's a ZIP, might be detected as generic ZIP)
    if (extension === 'DOCX' && detectedType !== 'DOCX') {
      warnings.push('File may not be a valid DOCX document')
    } else if (extension === 'DOC' && detectedType !== 'DOC') {
      return {
        valid: false,
        error: 'File is not a valid Microsoft Word document',
      }
    } else if (extension === 'PDF' && detectedType !== 'PDF') {
      return {
        valid: false,
        error: 'File is not a valid PDF document',
      }
    }
  }

  // Verify MIME type (if strict mode)
  if (strictMimeType && extension in FILE_SIGNATURES) {
    const allowedMimes = Array.from(FILE_SIGNATURES[extension].mimeTypes) as string[]
    if (!allowedMimes.includes(mimeType)) {
      warnings.push(`MIME type mismatch: expected ${allowedMimes.join(' or ')}, got ${mimeType}`)
    }
  }

  // Check for suspicious patterns that might indicate malicious files
  const suspiciousPatterns = [
    { bytes: [0x4d, 0x5a], name: 'Executable (MZ header)' }, // Windows EXE
    { bytes: [0x7f, 0x45, 0x4c, 0x46], name: 'Linux executable (ELF)' },
    { bytes: [0x23, 0x21], name: 'Shell script (#!)' },
    { bytes: [0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74], name: 'HTML script tag' },
  ]

  for (const pattern of suspiciousPatterns) {
    if (verifyMagicBytes(buffer, pattern.bytes)) {
      return {
        valid: false,
        error: `Suspicious file content detected: ${pattern.name}`,
      }
    }
  }

  // Additional security checks for ZIP-based formats (DOCX)
  if (detectedType === 'DOCX') {
    // Check for ZIP bombs (extremely high compression ratio)
    const compressionRatio = buffer.byteLength / file.size
    if (compressionRatio < 0.01) {
      warnings.push('File has very high compression ratio - potential ZIP bomb')
    }
  }

  return {
    valid: true,
    fileType: extension === 'MARKDOWN' ? 'MARKDOWN' : detectedType || extension,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate multiple files (for batch uploads)
 */
export async function validateFiles(
  files: File[],
  options?: Parameters<typeof validateFile>[1]
): Promise<FileValidationResult[]> {
  return Promise.all(files.map((file) => validateFile(file, options)))
}

/**
 * Check filename for dangerous patterns
 */
export function isFilenameSafe(filename: string): boolean {
  // Reject if contains directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false
  }

  // Reject if contains null bytes
  if (filename.includes('\0')) {
    return false
  }

  // Reject if too long
  if (filename.length > 255) {
    return false
  }

  // Reject if starts with dot (hidden file on Unix)
  if (filename.startsWith('.')) {
    return false
  }

  return true
}

/**
 * Rate limiting helper for file uploads
 * Tracks uploads per user per time window
 */
export class FileUploadRateLimiter {
  private uploads: Map<string, number[]> = new Map()
  private readonly maxUploads: number
  private readonly windowMs: number

  constructor(maxUploads = 10, windowMinutes = 60) {
    this.maxUploads = maxUploads
    this.windowMs = windowMinutes * 60 * 1000
  }

  /**
   * Check if user can upload (and record the attempt)
   */
  canUpload(userId: string): boolean {
    const now = Date.now()
    const userUploads = this.uploads.get(userId) || []

    // Remove old uploads outside the time window
    const recentUploads = userUploads.filter((timestamp) => now - timestamp < this.windowMs)

    if (recentUploads.length >= this.maxUploads) {
      return false
    }

    // Record this upload
    recentUploads.push(now)
    this.uploads.set(userId, recentUploads)

    return true
  }

  /**
   * Get remaining upload quota
   */
  getRemainingUploads(userId: string): number {
    const now = Date.now()
    const userUploads = this.uploads.get(userId) || []
    const recentUploads = userUploads.filter((timestamp) => now - timestamp < this.windowMs)

    return Math.max(0, this.maxUploads - recentUploads.length)
  }

  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.uploads.clear()
  }
}

// Export singleton instance for server-wide rate limiting
export const globalFileUploadLimiter = new FileUploadRateLimiter(10, 60)
