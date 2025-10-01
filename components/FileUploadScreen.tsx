import React, { useState, useCallback } from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface FileUploadScreenProps {
  onUpload: (content: string) => void;
}

// Let TypeScript know that pdfjsLib is available globally.
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

/**
 * Dynamically imports necessary libraries and parses the file content to text.
 * @param file The file to parse.
 * @returns A promise that resolves to the text content of the file.
 */
const parseFile = async (file: File): Promise<string> => {
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
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Could not parse the DOCX file. It may be corrupted.");
      }
      
    case 'md':
      try {
        const { marked } = await import('marked');
        const mdText = await file.text();
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


const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onUpload }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const textContent = await parseFile(file);
      onUpload(textContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the file.');
    } finally {
      setIsLoading(false);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault(); // This is necessary to allow dropping
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative block w-full rounded-lg border-2 border-dashed border-slate-600 p-12 text-center hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors duration-200 cursor-pointer ${isDragging ? 'bg-slate-800 border-purple-500' : 'bg-slate-800/50'}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <SpinnerIcon className="w-12 h-12 text-purple-400 animate-spin" />
            <span className="mt-4 text-lg font-semibold text-slate-300">Processing Document...</span>
            <p className="text-sm text-slate-400">This may take a moment.</p>
          </div>
        ) : (
          <>
            <BookOpenIcon className="mx-auto h-12 w-12 text-slate-500" />
            <span className="mt-4 block text-lg font-semibold text-slate-300">
              Upload a book or drop a file
            </span>
            <p className="mt-1 text-sm text-slate-400">
              Supports .pdf, .docx, .md, or .txt
            </p>
          </>
        )}
      </label>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} disabled={isLoading} accept=".pdf,.docx,.md,.txt" />
      {error && (
        <div className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">
          <p className="font-semibold">Upload Failed</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadScreen;