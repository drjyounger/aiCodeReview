const { generateSystemPrompt } = require('../prompts/systemPrompt');

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent";

const GEMINI_CONFIG = {
  temperature: 0.7,
  candidateCount: 1,
  // Explicitly NOT setting maxOutputTokens to allow Gemini to use its maximum context window
  // Gemini-2.0-flash-exp has a large context window when maxOutputTokens is not specified
};

const generateCodeReview = async ({ jiraTicket, githubPR, concatenatedFiles, referenceFiles }) => {
  try {
    const promptString = generateSystemPrompt({
      jiraTicket,
      githubPR,
      concatenatedFiles,
      referenceFiles,
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptString
          }]
        }],
        generationConfig: GEMINI_CONFIG
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Unexpected response format from Gemini API');
    }

    const generatedText = result.candidates[0].content.parts[0].text;

    if (!generatedText.includes('1. SUMMARY') || 
        !generatedText.includes('2. CRITICAL ISSUES')) {
      throw new Error('Generated review does not contain the required sections');
    }

    return {
      success: true,
      data: generatedText
    };
  } catch (error) {
    console.error('Error generating review:', error);
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : 'Failed to generate review'
    };
  }
};

module.exports = {
  generateCodeReview
};
