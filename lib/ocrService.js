import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

/**
 * Process image with OCR and extract text
 * @param {string} filePath - Path to the image file
 * @param {string} language - Language code (default: 'eng')
 * @returns {Promise<{text: string, language: string, confidence: number}>}
 */
export async function processImage(filePath, language = 'eng') {
  try {
    console.log(`🔍 Starting OCR processing for: ${filePath}`);
    console.log(`📝 Language: ${language}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    // Run Tesseract OCR
    const { data } = await Tesseract.recognize(
      filePath,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      }
    );
    
    console.log(`✅ OCR completed. Extracted ${data.text.length} characters`);
    
    return {
      text: data.text,
      language: language,
      confidence: data.confidence || 0,
    };
  } catch (error) {
    console.error('❌ OCR Error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Validate if file is a supported image format
 */
export function isValidImageFile(mimeType) {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'];
  return validTypes.includes(mimeType);
}
