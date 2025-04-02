# AI Code Review Assistant

A multi-step wizard that pulls Jira tickets, GitHub PR details, and local files to concatenate them into a large context file and send to a language model (Gemini) for an automated code review.

## Table of Contents
- [Overview](#overview)
- [Main Features](#main-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Usage Walkthrough](#usage-walkthrough)
- [Common Troubleshooting](#common-troubleshooting)
- [Additional Notes](#additional-notes)

## Overview
This project is an AI-driven code review assistant. It allows you to:

- Fetch JIRA ticket details by ticket number(s)
- Fetch GitHub Pull Request details (for both frontend and backend repositories, or any custom repositories)
- Select relevant local files/folders (in a tree view with checkboxes) and automatically concatenate their contents into one large Markdown file
- Include additional reference files (database schema, business context, coding standards) for context
- Send all this data to a large language model (Google Gemini) for an automated, structured code review
- The wizard then returns a comprehensive code-review with sections covering critical issues, security checks, performance, business logic alignment, and more

## Main Features

### Dynamic Repository Configuration
- Support for multiple repositories with configurable settings
- Persistent storage of repository paths for a smoother workflow
- Environment variable overrides for deployment flexibility
- Repository settings are remembered between sessions

### Jira Ticket Retrieval
- Uses your Jira credentials (via environment variables) to fetch issue details (summary, description) for one or more ticket numbers
- Supports comma-separated ticket numbers (e.g., PROJ-123, PROJ-124, PROJ-125)
- Fetches all tickets in parallel for better performance
- Displays tickets in a clean, organized layout with chips for ticket keys
- Enhanced error handling with per-ticket error recovery

### GitHub PR Retrieval
- Connects to GitHub (via Personal Access Token) to read PR metadata (title, description) and changed files
- Supports multiple repositories simultaneously
- Smart error handling with detailed feedback

### Workspace Concept for Repository Navigation
- Tab-based interface for navigating between repositories
- Visual indicators for PRs in each repository
- Path memory for frequently accessed repositories
- Unified file selection across multiple repositories

### Local File Selection & Concatenation
- A local file tree (using rc-tree) is displayed so you can selectively check folders/files to include
- The entire set of checked files is concatenated into a single Markdown document for LLM consumption
- Improved error handling with fallback for file read failures
- Selection count indicators for better user feedback

### Enhanced Error Handling & Debugging
- Comprehensive error logging system with categorization
- Debug mode with detailed logs for troubleshooting
- Graceful recovery from API failures
- User-friendly error messages with specific guidance

### Additional References
- The wizard optionally includes "reference files" like your database schema, business context, design & coding standards, etc.

### LLM Submission
- All the above is combined into a final system prompt sent to the Gemini LLM for an automated, structured code review
- Uses the latest Gemini Pro model (gemini-2.5-pro-exp-03-25) with enhanced features
- Includes retry logic, error handling, and response validation
- Collapsible prompt preview for inspection before submission

### Review Output
- The review is displayed back to you with collapsible sections (summary, critical issues, recommendations, etc.)
- Export options:
  - Copy to clipboard functionality for easy sharing
  - Download as Markdown file with timestamp
  - Collapsible sections for better readability
  - Color-coded sections for different types of feedback

## Tech Stack
- Front End: React (TypeScript + MUI for styling)
- Server: Node.js + Express (runs on localhost:3001 by default)
- rc-tree for file-tree exploration
- Axios for HTTP calls to JIRA and GitHub
- Octokit to interact with GitHub's REST API
- Google Gemini LLM for generating the code review (via an HTTP POST call)
- Local File Access: The server portion uses Node/Express to read your local filesystem directories and files (with safety checks)

## Project Structure
Here is a simplified look at relevant folders & files:

```
AICodeReview/
├── README.md
├── package.json
├── tsconfig.json
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── types/
│   ├── references/
│   ├── server/
│   │   ├── proxy.js       <-- Express server
│   │   ├── package.json
│   │   ├── utils/
│   │   │   ├── errorHandling.ts  <-- Centralized error handling
│   │   │   ├── repoConfig.ts     <-- Dynamic repository configuration
│   │   │   └── fileFormatter.ts  <-- File concatenation utilities
│   │   │   └── storage.ts        <-- LocalStorage management
│   │   ├── components/
│   │   │   ├── FileTree.tsx
│   │   │   ├── ReviewWizard.tsx
│   │   │   └── Steps/         <-- each wizard step is here
│   │   ├── prompts/
│   │   ├── services/
│   │   └── ...
```

### Notable Files & Folders
- `src/server/proxy.js`: The primary Node/Express server that handles:
  - Local file/directory reading (`/api/local/directory` & `/api/local/file`)
  - Jira request endpoint
  - The final LLM submission endpoint (`/api/generate-review`)
  - File writing capabilities (`/api/local/write-file`)
  - Download functionality

- `src/components/Steps/`: Each step in the multi-step wizard:
  - `JiraTicketStep.tsx` (Step 1)
  - `GitHubPRStep.tsx` (Step 2) - Supports multiple repository configurations
  - `FileSelectionStep.tsx` (Step 3) - Enhanced with repository tabs
  - `AdditionalFilesStep.tsx` (Step 4)
  - `ReviewSubmissionStep.tsx` (Step 5) - Now with debug logging and preview
  - `Step6ReviewResults.tsx` (Step 6) - Includes download and copy functionality

- `src/utils/repoConfig.ts`: Manages dynamic repository configuration
- `src/utils/errorHandling.ts`: Centralized error handling and logging
- `src/components/FileTree.tsx`: Renders a recursive file tree using rc-tree
- `src/services/LLMService.js`: The bridging code that constructs a prompt and calls the Gemini LLM endpoint
- `src/prompts/systemPrompt.js`: Defines how the final system prompt for the LLM is generated
- `src/utils/fileFormatter.ts`: Contains logic for concatenating files, adding table of contents, code fences, etc.

## Installation & Setup

1. Clone or Download this repository
2. Install Node.js (v16+ recommended)
3. From the project root, install dependencies:
```bash
# If you have one combined package.json at the root:
npm install

# If you also have a separate server/package.json:
cd src/server
npm install
```

## Environment Variables
You should provide environment variables via a `.env` file or system environment settings. For local development, a `.env` in the root of the project is typical.

Example `.env` (in the project root):
```env
# JIRA
REACT_APP_JIRA_API_URL=https://yourdomain.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@example.com
REACT_APP_JIRA_API_TOKEN=XXXXXX # typically a personal access token (PAT) or API token

# GITHUB
REACT_APP_GITHUB_TOKEN=XXXXXX

# REPOSITORY CONFIGURATIONS
# Frontend Repository
REACT_APP_FRONTEND_OWNER=drjyounger
REACT_APP_FRONTEND_REPO=tempstars-app
REACT_APP_FRONTEND_PATH=/path/to/local/frontend/repo  # Optional: Default local path

# Backend Repository
REACT_APP_BACKEND_OWNER=drjyounger
REACT_APP_BACKEND_REPO=tempstars-api
REACT_APP_BACKEND_PATH=/path/to/local/backend/repo  # Optional: Default local path

# LLM (Gemini Pro)
REACT_APP_GEMINI_API_KEY=XXXXXX  # Get your API key from Google AI Studio (https://makersuite.google.com/app/apikey)

# For the server
REACT_APP_SERVER_PORT=3001
PORT=3001
```

## Running the Application

### Run the Development Server
Typically, you start both the React app and Node server concurrently.

Option A: Use `npm run dev` if you have a concurrency script in package.json:
```bash
npm run dev
```

Option B: Manually in two terminals:
```bash
# Terminal 1
npm start
# or react-scripts start

# Terminal 2
cd src/server
node proxy.js
# or npm run dev
```

### Open the React App
Go to http://localhost:3000

The server endpoints (e.g., for local file reading) are on port 3001.

## Usage Walkthrough
The tool is a six-step wizard:

1. **Jira Tickets**
   - Enter one or more Jira ticket numbers separated by commas (e.g., PROJ-123, PROJ-124, PROJ-125)
   - Click "Fetch Tickets." The system calls your local Node server, which calls JIRA's API for each ticket
   - If successful, it shows the ticket summaries and descriptions in an organized layout
   - Press "Next" to continue

2. **GitHub PR**
   - Select which repositories to include (frontend, backend, or both)
   - Enter the PR number(s) for each selected repository and click "Fetch PR(s)"
   - The relevant PR details + changed files appear for each repository
   - Press "Next" to continue

3. **Select Files**
   - Use the tabs at the top to switch between repositories
   - For each repository, enter the root path for your local code
   - Click "Fetch Directory" to load the file tree for the current repository
   - Navigate between repositories using the tabs to select files from multiple sources
   - Expand directories, check the boxes for files/folders to include in your review
   - Press "Concatenate Files" to build a single markdown document with all selected files
   - Press "Next" to continue

4. **Additional Files**
   - The wizard offers reference files (like DB schema or coding standards)
   - Check any you want appended to the code review context
   - Press "Next"

5. **Submit Review**
   - The wizard assembles the final system prompt with all collected data
   - Click "Show Debug Logs" to see detailed information about the data collection process
   - Click "Preview API Call" to inspect the exact prompt that will be sent
   - Click "Submit Review" to send the prompt to Gemini LLM
   - The submission process includes detailed logging for troubleshooting

6. **Review Results**
   - The code review from the LLM is displayed with collapsible sections
   - Use the copy button to copy the entire review to clipboard
   - Use the download button to save the review as a Markdown file
   - From here, you can start a new review or go back to fix anything

## Common Troubleshooting

### Local File Tree Not Loading
- Ensure the absolute path you typed in Step 3 is valid and allowed by `isPathSafe(...)` in proxy.js
- By default, the server may block certain directories or subfolders (like .ssh, .aws, etc.)
- Add your project path to the allowed paths in proxy.js if needed
- Check the debug logs (in Step 5) for detailed error information

### Repository Configuration Issues
- If you're having trouble with repository settings, check your .env file for the correct environment variables
- The application will remember paths you've used before - check the debug logs to see what paths are being loaded
- You can manually clear stored paths by clearing localStorage in your browser

### Jira or GitHub Calls Failing
- Check your .env for valid tokens and base URLs
- Test them with a simple cURL or Postman to confirm
- The debug logs will show detailed API error information
- The application now supports partial failure (e.g., if one ticket fails but others succeed)

### Gemini LLM
- If you see an error: "Gemini API error: Unauthorized," your `REACT_APP_GEMINI_API_KEY` might be missing or invalid
- In `LLMService.js`, confirm `GEMINI_API_KEY` is set
- Make sure you're using a valid API key from Google AI Studio
- Check the detailed error logs for specific API error messages

### Large File Selections
- If your directory is huge, selecting it could take a while (the recursion might be slow)
- You can filter out large binary files by default; ensure you only include text-based code files
- The UI now shows the count of selected files for better feedback

### Local Storage
- The wizard uses localStorage for storing step data
- If something appears "reset," check if your browser is clearing local storage
- Repository paths are now persisted separately from other wizard data

## Additional Notes

### Security
- This tool is meant for local, internal use
- The code attempts to disallow reading sensitive OS directories by default
- If you expand its usage or host it online, you'll need to reinforce path-safety checks and add authentication

### Performance
- For extremely large codebases (thousands of files), generating a file tree and reading them all can be slow
- You can filter or refine the logic in `FileTree.tsx` or use partial recursion if needed
- The application now gracefully handles file read failures during concatenation

### Customize the LLM
- The prompt in `systemPrompt.js` is quite detailed
- You can adjust instructions for different styles of code reviews, or integrate another LLM

### Future Plans
- Potentially add token-based chunking to avoid LLM context limits if the concatenated file gets too large
- Add file type filtering options in the file tree
- Support for token counting and model selection based on prompt size
- Advanced cross-repo dependency visualization

## Conclusion
This AI Code Review Assistant tool can speed up your code review process by combining relevant context from Jira, GitHub, and local code to produce a thorough initial review from an LLM. With the enhanced multi-repository support and improved error handling, it's now more robust for real-world development scenarios spanning multiple codebases.

Questions or issues? Open an issue or tweak the code as needed. Good luck!