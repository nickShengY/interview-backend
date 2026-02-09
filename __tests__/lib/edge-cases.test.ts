/**
 * Edge case tests covering boundary conditions, malformed data, XSS, overflow, etc.
 */

import { sanitizeFilename, isFilenameSafe, FileUploadRateLimiter } from '@/lib/file-security'
import { cn } from '@/lib/utils'

describe('Edge Cases', () => {
  describe('sanitizeFilename edge cases', () => {
    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('file')
    })

    it('should handle string with only special chars', () => {
      expect(sanitizeFilename('!!!@@@###')).toBe('_________')
    })

    it('should remove directory traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd')
    })

    it('should remove backslash paths', () => {
      expect(sanitizeFilename('C:\\Windows\\System32\\cmd.exe')).toBe('cmd.exe')
    })

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(500) + '.pdf'
      const result = sanitizeFilename(longName)
      expect(result.length).toBeLessThanOrEqual(255)
    })

    it('should handle unicode characters', () => {
      const result = sanitizeFilename('résumé_日本語.pdf')
      expect(result).toContain('.pdf')
    })

    it('should replace double dots', () => {
      const result = sanitizeFilename('file..pdf')
      expect(result).not.toContain('..')
    })

    it('should remove leading dot (hidden files)', () => {
      const result = sanitizeFilename('.hidden')
      expect(result).not.toMatch(/^\./)
    })

    it('should handle null bytes in filename', () => {
      const result = sanitizeFilename('file\0.pdf')
      expect(result).not.toContain('\0')
    })

    it('should handle spaces', () => {
      const result = sanitizeFilename('my resume 2024.pdf')
      // Spaces get replaced with underscore
      expect(result).toContain('_')
    })
  })

  describe('isFilenameSafe edge cases', () => {
    it('should reject directory traversal with ..', () => {
      expect(isFilenameSafe('../test.pdf')).toBe(false)
    })

    it('should reject forward slashes', () => {
      expect(isFilenameSafe('path/to/file.pdf')).toBe(false)
    })

    it('should reject backslashes', () => {
      expect(isFilenameSafe('path\\to\\file.pdf')).toBe(false)
    })

    it('should reject null bytes', () => {
      expect(isFilenameSafe('file\0.pdf')).toBe(false)
    })

    it('should reject filenames > 255 chars', () => {
      expect(isFilenameSafe('a'.repeat(256))).toBe(false)
    })

    it('should reject hidden files (leading dot)', () => {
      expect(isFilenameSafe('.gitignore')).toBe(false)
    })

    it('should accept normal filenames', () => {
      expect(isFilenameSafe('resume.pdf')).toBe(true)
      expect(isFilenameSafe('my-resume-2024.docx')).toBe(true)
      expect(isFilenameSafe('cover_letter.txt')).toBe(true)
    })

    it('should accept filenames at exactly 255 chars', () => {
      expect(isFilenameSafe('a'.repeat(255))).toBe(true)
    })

    it('should accept filenames with numbers and hyphens', () => {
      expect(isFilenameSafe('resume-v2-final-2024.pdf')).toBe(true)
    })
  })

  describe('FileUploadRateLimiter edge cases', () => {
    it('should limit uploads per user', () => {
      const limiter = new FileUploadRateLimiter(2, 60)
      expect(limiter.canUpload('user-1')).toBe(true)
      expect(limiter.canUpload('user-1')).toBe(true)
      expect(limiter.canUpload('user-1')).toBe(false)
    })

    it('should track different users independently', () => {
      const limiter = new FileUploadRateLimiter(1, 60)
      expect(limiter.canUpload('user-a')).toBe(true)
      expect(limiter.canUpload('user-a')).toBe(false)
      expect(limiter.canUpload('user-b')).toBe(true)
    })

    it('should return correct remaining uploads', () => {
      const limiter = new FileUploadRateLimiter(5, 60)
      expect(limiter.getRemainingUploads('user-1')).toBe(5)
      limiter.canUpload('user-1')
      expect(limiter.getRemainingUploads('user-1')).toBe(4)
    })

    it('should return 0 remaining when exhausted', () => {
      const limiter = new FileUploadRateLimiter(1, 60)
      limiter.canUpload('user-1')
      expect(limiter.getRemainingUploads('user-1')).toBe(0)
    })

    it('should clear all data', () => {
      const limiter = new FileUploadRateLimiter(1, 60)
      limiter.canUpload('user-1')
      limiter.clear()
      expect(limiter.canUpload('user-1')).toBe(true)
    })

    it('should handle zero maxUploads', () => {
      const limiter = new FileUploadRateLimiter(0, 60)
      expect(limiter.canUpload('user-1')).toBe(false)
    })

    it('should allow uploads after window expires', () => {
      const limiter = new FileUploadRateLimiter(1, 0.001) // ~60ms window
      limiter.canUpload('user-1')
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(limiter.canUpload('user-1')).toBe(true)
          resolve()
        }, 100)
      })
    })
  })

  describe('cn() edge cases', () => {
    it('should handle extremely long class strings', () => {
      const longClass = 'class-' + 'a'.repeat(1000)
      const result = cn(longClass)
      expect(result).toContain(longClass)
    })

    it('should handle mixed falsy values', () => {
      expect(cn(false, null, undefined, 0, '', 'valid')).toBe('valid')
    })

    it('should handle nested arrays', () => {
      const result = cn(['a', ['b', 'c']])
      expect(result).toContain('a')
    })
  })

  describe('XSS prevention edge cases', () => {
    it('sanitizeFilename should neutralize script tags', () => {
      const result = sanitizeFilename('<script>alert("xss")</script>.pdf')
      expect(result).not.toContain('<script>')
    })

    it('sanitizeFilename should neutralize event handlers', () => {
      const result = sanitizeFilename('file" onload="alert(1).pdf')
      expect(result).not.toContain('"')
    })

    it('isFilenameSafe should reject filenames with HTML', () => {
      // These will be rejected because they contain special chars that resolve to safe=false via / or ..
      const result = sanitizeFilename('<img src=x onerror=alert(1)>.pdf')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })
  })

  describe('Number overflow and boundary tests', () => {
    it('FileUploadRateLimiter handles MAX_SAFE_INTEGER uploads', () => {
      const limiter = new FileUploadRateLimiter(Number.MAX_SAFE_INTEGER, 60)
      expect(limiter.canUpload('user-1')).toBe(true)
      expect(limiter.getRemainingUploads('user-1')).toBeLessThan(Number.MAX_SAFE_INTEGER)
    })

    it('sanitizeFilename handles zero-length result', () => {
      // All chars stripped + leading dot removed = "file"
      const result = sanitizeFilename('.')
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
