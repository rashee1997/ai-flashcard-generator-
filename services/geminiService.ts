import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData } from '../types';

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI instance.
 * This prevents the constructor from throwing an error on app load if the API key is missing.
 */
const getAiInstance = () => {
  // Safely check for the API key to prevent a ReferenceError in browser environments.
  if (typeof process === 'undefined' || !process.env || !process.env.API_KEY) {
    throw new Error("Could not connect to the AI service. The API key is missing or invalid. Please ensure it's configured correctly in the environment.");
  }
  const API_KEY = process.env.API_KEY;

  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};


const flashcardSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, engaging title for the flashcard topic. Max 5-7 words.",
    },
    content: {
      type: Type.STRING,
      description: "The main content of the flashcard. A concise, easy-to-understand piece of micro-information. Max 2-3 sentences.",
    },
    category: {
      type: Type.STRING,
      description: "A single-word category for the content (e.g., 'Productivity', 'History', 'Science')."
    },
    mood: {
      type: Type.STRING,
      description: "The dominant mood or tone of the content. Must be one of: 'energetic', 'calm', 'serious', 'inspirational', 'technical', 'creative'."
    },
    icon: {
      type: Type.STRING,
      description: "A single emoji that visually represents the content's category or theme."
    }
  },
  required: ["title", "content", "category", "mood", "icon"],
};

export const generateFlashcard = async (
    bookContent: string, 
    existingTitles: string[]
): Promise<Omit<FlashcardData, 'id'>> => {
  try {
    const prompt = `
      Based on the following book content, create a single, concise micro-learning flashcard.
      The flashcard should have a 'title', 'content', and styling information ('category', 'mood', 'icon').
      The content should be a small, digestible piece of information, ideal for quick learning.
      It must be a distinct concept not covered by the existing titles provided.

      Analyze the content to determine the styling:
      - 'category': A single word describing the topic.
      - 'mood': The feeling of the content. Must be one of 'energetic', 'calm', 'serious', 'inspirational', 'technical', 'creative'.
      - 'icon': A single emoji that fits the topic.

      IMPORTANT: Do NOT generate a flashcard on any of the following topics, as they have already been created:
      ${existingTitles.length > 0 ? `- ${existingTitles.join('\n- ')}` : 'N/A'}

      The response must be in JSON format conforming to the provided schema.

      Book Content (a snippet is provided for context):
      """
      ${bookContent.substring(0, 32000)}...
      """
    `;

    // Initialize the AI instance here, inside the try/catch block.
    const genAI = getAiInstance();

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: flashcardSchema,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    let jsonText = response.text.trim();
    
    // The model can sometimes wrap the JSON in markdown backticks.
    // This removes them if they exist.
    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3, -3).trim();
    }

    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error generating flashcard from Gemini API:", error);
    if (error instanceof SyntaxError) {
        // This likely means the AI returned a malformed JSON.
        throw new Error("The AI returned an invalid response. Please try again.");
    }
    // Propagate other specific errors (like the API key error) directly to the UI.
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while generating the flashcard.");
  }
};