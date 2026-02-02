/**
 * Unit tests for file security validation utilities
 */

import { validateFile, sanitizeFilename } from '@/lib/file-security'

const createFile = (content: string | BlobPart[], name: string, type: string) => {
  const blob = new Blob(Array.isArray(content) ? content : [content], { type })
  return new File([blob], name, { type })
}

describe('File Security', () => {
  describe('sanitizeFilename', () => {
    it('strips directory traversal', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd')
      expect(sanitizeFilename('..\\..\\secret.pdf')).toBe('secret.pdf')
    })

    it('replaces unsafe characters', () => {
      expect(sanitizeFilename('report 2024?.pdf')).toBe('report_2024_.pdf')
    })
  })

  describe('validateFile', () => {
    it('accepts markdown files with .md extension', async () => {
      const mdContent = '# Notes\n\nThis is a markdown file.'
      const file = createFile(mdContent, 'notes.md', 'text/markdown')

      const result = await validateFile(file, {
        allowedTypes: ['PDF', 'TXT', 'MARKDOWN'],
        strictMimeType: true,
      })

      expect(result.valid).toBe(true)
      expect(result.fileType).toBe('MARKDOWN')
    })

    it('rejects unsupported extensions', async () => {
      const file = createFile('data', 'script.exe', 'application/octet-stream')

      const result = await validateFile(file, {
        allowedTypes: ['PDF', 'TXT'],
      })

      expect(result.valid).toBe(false)
      expect(result.error).toMatch(/unsupported file type/i)
    })

    it('rejects non-matching PDF magic bytes', async () => {
      const file = createFile('Not a PDF', 'resume.pdf', 'application/pdf')

      const result = await validateFile(file, {
        allowedTypes: ['PDF'],
      })

      expect(result.valid).toBe(false)
      expect(result.error).toMatch(/not a valid pdf/i)
    })
  })
})
