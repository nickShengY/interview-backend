import fs from 'node:fs/promises';
import path from 'node:path';

// Lazy-load PDFParse class from pdf-parse (ESM) at runtime in Node.js
type PdfParseTextResult = { text?: string }
type PdfParseInstance = { getText?: () => Promise<PdfParseTextResult | undefined> }
type PdfParseConstructor = new (opts: { data: Buffer }) => PdfParseInstance
type PdfParseModule = { PDFParse?: PdfParseConstructor; default?: { PDFParse?: PdfParseConstructor } }

function hasMessage(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (hasMessage(err)) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

let PdfParseClass: PdfParseConstructor | null = null

async function getPdfParseClass() {
  if (!PdfParseClass) {
    // pdf-parse is an ESM package; dynamic import gives us named exports
    const mod: unknown = await import('pdf-parse')
    const parsedMod = mod as PdfParseModule
    const PDFParse = parsedMod.PDFParse ?? parsedMod.default?.PDFParse
    if (!PDFParse) {
      throw new Error('Failed to load pdf-parse module: PDFParse export not found')
    }
    PdfParseClass = PDFParse
  }
  return PdfParseClass
}

/**
 * Extract plain text from a resume file.
 *
 * Supported formats:
 * - .pdf  (via pdf-parse)
 * - .txt, .md (plain text)
 */
export async function extractResumeText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf': {
      const data = await fs.readFile(filePath);
      const PDFParse = await getPdfParseClass()
      const parser = new PDFParse({ data })
      const result = await parser.getText?.()
      const content = (result?.text || '').trim();
      if (!content) {
        throw new Error('No readable text found in PDF. Please use a text-based PDF.');
      }
      return content;
    }
    case '.txt':
    case '.md': {
      const raw = await fs.readFile(filePath, 'utf8');
      return raw.toString();
    }
    default: {
      throw new Error(`Unsupported file format: ${ext}. Please upload a PDF or plain text file.`);
    }
  }
}

/**
 * Extract text from a File object (for API routes using FormData).
 *
 * Implementation detail:
 *  - We offload all heavy parsing (PDF, DOCX, TXT/MD) to the Python backend,
 *    which already has robust extractors (pdfplumber / python-docx / fallbacks).
 */
export async function extractTextFromFile(file: File): Promise<{ content: string; pages: number }> {
  const backend = process.env.NEXT_PUBLIC_ATS_API || 'http://localhost:8000'

  const form = new FormData()
  form.append('file', file)

  let res: Response
  try {
    res = await fetch(`${backend}/extract-text`, {
      method: 'POST',
      body: form,
    })
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err) || 'Failed to reach text extraction service')
  }

  const raw = await res.text()

  if (!res.ok) {
    // FastAPI returns {detail: ...} on error
    try {
      const errJson = JSON.parse(raw)
      const msg = errJson.detail || errJson.error || raw
      throw new Error(String(msg || 'Text extraction failed'))
    } catch {
      throw new Error(raw || 'Text extraction failed')
    }
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Text extraction service returned invalid JSON')
  }

  const obj = (typeof data === 'object' && data !== null) ? (data as Record<string, unknown>) : {}

  const contentValue = obj.content
  const content = (contentValue ?? '').toString()

  const pagesRaw = obj.pages
  const pagesValue = typeof pagesRaw === 'number' || typeof pagesRaw === 'string' ? Number(pagesRaw) : NaN
  const pages = Number.isFinite(pagesValue) && pagesValue > 0 ? pagesValue : 1

  if (!content || !content.trim()) {
    throw new Error('No text content could be extracted from this file.')
  }

  return { content, pages }
}
