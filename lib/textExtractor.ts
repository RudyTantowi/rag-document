import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

// Max file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Deep clean text from extracted content
 * Menghapus: headers/footers, page numbers, URLs, emails, special characters, gibberish, lines/borders
 */
export function deepCleanText(text: string): string {
  let cleaned = text;

  // Remove page numbers (e.g., "Page 1", "1", "- 1 -", etc.)
  cleaned = cleaned.replace(/^[\s]*page\s+\d+[\s]*$/gim, '');
  cleaned = cleaned.replace(/^[\s]*-?\s*\d+\s*-?[\s]*$/gm, '');
  
  // Remove common headers/footers patterns
  cleaned = cleaned.replace(/^[\s]*(?:header|footer)[\s]*:?.*$/gim, '');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s]+/gi, '');
  
  // Remove email addresses
  cleaned = cleaned.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '');
  
  // Remove lines with only special characters/borders (e.g., "----", "====", "____")
  cleaned = cleaned.replace(/^[\s]*[-=_*#+~]{3,}[\s]*$/gm, '');
  
  // Remove lines with repetitive characters (gibberish)
  cleaned = cleaned.replace(/^[\s]*(.)\1{10,}[\s]*$/gm, '');
  
  // Remove non-printable characters except newlines and tabs
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, '');
  
  // Remove excessive special characters (keep some punctuation)
  cleaned = cleaned.replace(/[^\w\s.,;:!?()\-'"\n\r\t]/g, ' ');
  
  // Remove multiple spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Remove multiple newlines (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading/trailing whitespace from each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // Remove empty lines at start and end
  cleaned = cleaned.trim();
  
  // Remove very short lines that are likely gibberish (less than 3 chars)
  const lines = cleaned.split('\n');
  const meaningfulLines = lines.filter(line => {
    // Keep empty lines for paragraph separation
    if (line === '') return true;
    // Remove very short lines unless they contain common words
    if (line.length < 3) return false;
    // Remove lines with too many non-letter characters
    const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
    return letterCount > line.length * 0.4;
  });
  
  cleaned = meaningfulLines.join('\n');
  
  return cleaned;
}

/**
 * Extract text from PDF file
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return deepCleanText(data.text);
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return deepCleanText(result.value);
  } catch (error) {
    throw new Error(`Failed to extract DOCX text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from plain text files (TXT, MD)
 */
export function extractPlainText(buffer: Buffer): string {
  try {
    const text = buffer.toString('utf-8');
    return deepCleanText(text);
  } catch (error) {
    throw new Error(`Failed to extract plain text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to extract text based on file type
 */
export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await extractPdfText(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return await extractDocxText(buffer);
    
    case 'text/plain':
    case 'text/markdown':
      return extractPlainText(buffer);
    
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return mimeType in SUPPORTED_FILE_TYPES;
}

/**
 * Get file extension from mime type
 */
export function getFileExtension(mimeType: string): string {
  const extensions = SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES];
  return extensions ? extensions[0] : '';
}
