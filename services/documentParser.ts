import mammoth from 'mammoth';
import { marked } from 'marked';

// pdf-ts is replaced by the globally available pdf.js library.
// We declare it here to inform TypeScript about the global variable.
declare const pdfjsLib: any;

/**
 * Strips HTML tags from a string to extract plain text content.
 * This is a helper for the markdown parser.
 * @param html The input string containing HTML.
 * @returns The plain text content.
 */
const stripHtml = (html: string): string => {
  // Use the browser's built-in parser to safely handle HTML.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export const parseFile = async (file: File): Promise<string> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'txt':
      return file.text();

    case 'pdf':
       if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF parsing library is not loaded.');
      }
      try {
        const fileReader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          fileReader.onload = async function() {
            try {
              const typedArray = new Uint8Array(this.result as ArrayBuffer);
              const pdf = await pdfjsLib.getDocument(typedArray).promise;
              let fullText = '';
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: { str: string }) => item.str)
                  .join(' ');
                fullText += pageText + '\n';
              }
              resolve(fullText);
            } catch (error) {
              reject(error);
            }
          };
          fileReader.onerror = reject;
          fileReader.readAsArrayBuffer(file);
        });
      } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Could not parse the PDF file. It may be corrupted or password-protected.");
      }

    case 'docx':
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Could not parse the DOCX file. It may be corrupted.");
      }
      
    case 'md':
      try {
        const mdText = await file.text();
        // Marked returns HTML, so we need to strip the tags to get plain text.
        const html = marked.parse(mdText);
        return stripHtml(html as string);
      } catch (error) {
        console.error("Error parsing MD:", error);
        throw new Error("Could not parse the Markdown file.");
      }

    default:
      throw new Error(`Unsupported file type: .${fileType}`);
  }
};