/**
 * Extended file security tests covering validateFile, validateFiles, and magic byte detection
 */

import { sanitizeFilename, isFilenameSafe, FileUploadRateLimiter, validateFile, validateFiles } from '@/lib/file-security'

// Helper to create a mock File from bytes
function createMockFile(name: string, bytes: number[], mimeType: string, size?: number): File {
  const buffer = new Uint8Array(bytes)
  const blob = new Blob([buffer], { type: mimeType })
  const file = new File([blob], name, { type: mimeType })
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size })
  }
  return file
}

describe('validateFile', () => {
  it('should reject empty files', async () => {
    const file = createMockFile('empty.pdf', [], 'application/pdf', 0)
    const result = await validateFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('should reject oversized files', async () => {
    const file = createMockFile('big.pdf', [0x25, 0x50, 0x44, 0x46], 'application/pdf')
    Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 }) // 100MB
    const result = await validateFile(file, { maxSize: 50 * 1024 * 1024 })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('too large')
  })

  it('should accept valid PDF files', async () => {
    // %PDF magic bytes
    const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]
    const file = createMockFile('resume.pdf', pdfBytes, 'application/pdf')
    const result = await validateFile(file)
    expect(result.valid).toBe(true)
    expect(result.fileType).toBe('PDF')
  })

  it('should accept valid DOCX files', async () => {
    // PK ZIP magic bytes (DOCX is a ZIP)
    const docxBytes = [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]
    const file = createMockFile('resume.docx', docxBytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const result = await validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('should accept valid DOC files', async () => {
    // Microsoft Office binary magic bytes
    const docBytes = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
    const file = createMockFile('resume.doc', docBytes, 'application/msword')
    const result = await validateFile(file)
    expect(result.valid).toBe(true)
    expect(result.fileType).toBe('DOC')
  })

  it('should accept valid TXT files', async () => {
    const txtBytes = Array.from('Hello, this is a plain text file with normal content.').map(c => c.charCodeAt(0))
    const file = createMockFile('notes.txt', txtBytes, 'text/plain')
    const result = await validateFile(file)
    expect(result.valid).toBe(true)
  })

  it('should reject unsupported file extension', async () => {
    const file = createMockFile('virus.exe', [0x4D, 0x5A], 'application/octet-stream')
    const result = await validateFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Unsupported file type')
  })

  it('should detect suspicious executable content', async () => {
    // MZ header (Windows EXE) disguised as PDF
    const exeBytes = [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]
    const file = createMockFile('malware.pdf', exeBytes, 'application/pdf')
    const result = await validateFile(file)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should detect ELF binary disguised as text', async () => {
    const elfBytes = [0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01, 0x01, 0x00]
    const file = createMockFile('notes.txt', elfBytes, 'text/plain')
    const result = await validateFile(file)
    expect(result.valid).toBe(false)
  })

  it('should reject PDF with wrong magic bytes', async () => {
    const wrongBytes = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
    const file = createMockFile('fake.pdf', wrongBytes, 'application/pdf')
    const result = await validateFile(file)
    expect(result.valid).toBe(false)
  })

  it('should accept custom maxSize', async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46]
    const file = createMockFile('small.pdf', pdfBytes, 'application/pdf')
    Object.defineProperty(file, 'size', { value: 1024 }) // 1KB
    const result = await validateFile(file, { maxSize: 2048 })
    expect(result.valid).toBe(true)
  })

  it('should accept custom allowedTypes', async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46]
    const file = createMockFile('resume.pdf', pdfBytes, 'application/pdf')
    const result = await validateFile(file, { allowedTypes: ['PDF'] })
    expect(result.valid).toBe(true)
  })

  it('should reject when file type not in allowedTypes', async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46]
    const file = createMockFile('resume.pdf', pdfBytes, 'application/pdf')
    const result = await validateFile(file, { allowedTypes: ['DOCX'] as any })
    expect(result.valid).toBe(false)
  })

  it('should handle markdown files', async () => {
    const mdBytes = Array.from('# Hello World\n\nThis is markdown.').map(c => c.charCodeAt(0))
    const file = createMockFile('readme.md', mdBytes, 'text/markdown')
    const result = await validateFile(file)
    expect(result.valid).toBe(true)
  })
})

describe('validateFiles', () => {
  it('should validate multiple files', async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46]
    const files = [
      createMockFile('a.pdf', pdfBytes, 'application/pdf'),
      createMockFile('b.pdf', pdfBytes, 'application/pdf'),
    ]
    const results = await validateFiles(files)
    expect(results).toHaveLength(2)
    results.forEach(r => expect(r.valid).toBe(true))
  })

  it('should handle empty array', async () => {
    const results = await validateFiles([])
    expect(results).toHaveLength(0)
  })

  it('should report individual failures', async () => {
    const pdfBytes = [0x25, 0x50, 0x44, 0x46]
    const files = [
      createMockFile('good.pdf', pdfBytes, 'application/pdf'),
      createMockFile('empty.pdf', [], 'application/pdf', 0),
    ]
    const results = await validateFiles(files)
    expect(results[0].valid).toBe(true)
    expect(results[1].valid).toBe(false)
  })
})

describe('sanitizeFilename additional tests', () => {
  it('should handle filenames with only extensions', () => {
    const result = sanitizeFilename('.pdf')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle filenames with multiple extensions', () => {
    const result = sanitizeFilename('resume.backup.pdf')
    expect(result).toContain('.pdf')
  })

  it('should handle filenames with spaces and special chars', () => {
    const result = sanitizeFilename('My Resume (Final Version) [2024].pdf')
    expect(result).not.toContain('(')
    expect(result).not.toContain('[')
  })

  it('should handle very short filenames', () => {
    expect(sanitizeFilename('a')).toBe('a')
    expect(sanitizeFilename('ab')).toBe('ab')
  })
})

describe('FileUploadRateLimiter additional tests', () => {
  it('should default to 10 uploads per 60 minutes', () => {
    const limiter = new FileUploadRateLimiter()
    for (let i = 0; i < 10; i++) {
      expect(limiter.canUpload('user-default')).toBe(true)
    }
    expect(limiter.canUpload('user-default')).toBe(false)
  })

  it('should handle rapid sequential uploads', () => {
    const limiter = new FileUploadRateLimiter(5, 60)
    const results = Array.from({ length: 10 }, () => limiter.canUpload('rapid'))
    expect(results.filter(Boolean)).toHaveLength(5)
    expect(results.filter(v => !v)).toHaveLength(5)
  })

  it('getRemainingUploads for unknown user should return max', () => {
    const limiter = new FileUploadRateLimiter(5, 60)
    expect(limiter.getRemainingUploads('unknown')).toBe(5)
  })
})
