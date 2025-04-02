const { generateSystemPrompt } = require('../prompts/systemPrompt');

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent";

const GEMINI_CONFIG = {
  temperature: 0.7,
  candidateCount: 1,
  // Explicitly NOT setting maxOutputTokens to allow Gemini to use its maximum context window
  // Gemini-2.5-pro-exp-03-25 has a large context window when maxOutputTokens is not specified
};

// Maximum prompt size (in tokens) to allow some headroom in the 2M context window
const MAX_PROMPT_TOKENS = 1800000;

const validateResponse = (text) => {
  const sections = {
    'Summary': text.includes('1. SUMMARY'),
    'Critical Issues': text.includes('2. CRITICAL ISSUES'),
    'Recommendations': text.includes('3. RECOMMENDATIONS'),
    'Positive Highlights': text.includes('4. POSITIVE HIGHLIGHTS'),
    'Detailed Breakdown': text.includes('5. DETAILED BREAKDOWN'),
    'Implementation Guide': text.includes('6. A HIGHLY DETAILED INSTRUCTION GUIDE')
  };

  console.log('📑 Section Verification:');
  Object.entries(sections).forEach(([section, present]) => {
    console.log(`- ${section}: ${present ? '✅' : '❌'}`);
  });

  return !Object.values(sections).some(present => !present);
};

const makeRequest = async (promptString, retryCount = 0) => {
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
      generationConfig: {
        ...GEMINI_CONFIG,
        // On retry, reduce temperature for more focused output
        temperature: retryCount > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * retryCount)) : GEMINI_CONFIG.temperature
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Unexpected response format from Gemini API');
  }

  return result.candidates[0].content.parts[0].text;
};

const generateCodeReview = async ({ jiraTicket, githubPR, concatenatedFiles, referenceFiles }) => {
  const startTime = Date.now();
  try {
    // Extract model name from the API URL
    const modelNameMatch = GEMINI_API_URL.match(/models\/([^:]+)/);
    const modelName = modelNameMatch ? modelNameMatch[1] : 'unknown-model';
    
    console.log('\n🔍 Starting Code Review Generation');
    console.log('=====================================');
    console.log('📋 Input Summary:');
    
    // Validate inputs
    if (!jiraTicket) {
      console.warn('Warning: jiraTicket is missing');
      jiraTicket = {};
    }
    
    if (!githubPR) {
      console.warn('Warning: githubPR is missing');
      githubPR = {};
    }
    
    if (typeof concatenatedFiles !== 'string') {
      console.warn('Warning: concatenatedFiles is not a string, converting to string');
      concatenatedFiles = String(concatenatedFiles || '');
    }
    
    if (!Array.isArray(referenceFiles)) {
      console.warn('Warning: referenceFiles is not an array, converting to array');
      referenceFiles = referenceFiles ? [referenceFiles] : [];
    }

    console.log(`- Jira ticket: ${jiraTicket.key || 'N/A'}`);
    console.log(`- GitHub PR: ${githubPR.number ? `#${githubPR.number}` : 'N/A'}`);
    console.log(`- Concatenated files size: ${concatenatedFiles.length} characters`);
    console.log(`- Reference files included: ${referenceFiles.length}`);
    console.log('-------------------------------------');

    console.log('🚀 Preparing LLM API call...');
    let promptString = generateSystemPrompt({
      jiraTicket,
      githubPR,
      concatenatedFiles,
      referenceFiles,
    });

    // Add explicit section requirements
    promptString = `${promptString}

IMPORTANT: Your response MUST include these exact section headers in this order:
1. SUMMARY
2. CRITICAL ISSUES
3. RECOMMENDATIONS
4. POSITIVE HIGHLIGHTS
5. DETAILED BREAKDOWN
6. A HIGHLY DETAILED INSTRUCTION GUIDE

Each section is required and must maintain this exact naming. Do not skip any sections.`;

    const estimatedTokens = Math.round(promptString.length / 4);
    console.log(`📝 Generated prompt details:`);
    console.log(`- Total length: ${promptString.length} characters`);
    console.log(`- Estimated tokens: ~${estimatedTokens}`);

    if (estimatedTokens > MAX_PROMPT_TOKENS) {
      throw new Error(`Prompt too large (${estimatedTokens} tokens). Maximum allowed is ${MAX_PROMPT_TOKENS} tokens.`);
    }

    console.log('-------------------------------------');

    // Try up to 3 times with different configurations
    let generatedText;
    let success = false;
    let lastError;

    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        console.log(`📡 Sending request to Gemini API (attempt ${attempt + 1}/3)...`);
        console.log(`- Model: ${modelName}`);
        console.log(`- Temperature: ${attempt > 0 ? Math.max(0.3, GEMINI_CONFIG.temperature - (0.1 * attempt)) : GEMINI_CONFIG.temperature}`);
        console.log(`- Timestamp: ${new Date().toISOString()}`);
        
        generatedText = await makeRequest(promptString, attempt);
        
        console.log('-------------------------------------');
        console.log('📊 Generation Results:');
        console.log(`- Response length: ${generatedText.length} characters`);
        console.log(`- Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

        // Validate response has all required sections
        if (validateResponse(generatedText)) {
          success = true;
          break;
        } else {
          console.log(`❌ Attempt ${attempt + 1} failed: Missing required sections`);
          if (attempt < 2) {
            console.log('🔄 Retrying with adjusted parameters...\n');
          }
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < 2) {
          console.log('🔄 Retrying...\n');
        }
      }
    }

    if (!success) {
      throw lastError || new Error('Failed to generate valid review after 3 attempts');
    }

    console.log('=====================================');
    console.log('✅ Code Review Generation Complete!\n');

    return {
      success: true,
      data: generatedText
    };
  } catch (error) {
    console.error('\n❌ Error in Code Review Generation');
    console.error('=====================================');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timeTaken: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
    });
    console.error('=====================================\n');
    
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
