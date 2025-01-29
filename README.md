AI Code Review Assistant
A multi-step wizard that pulls Jira tickets, GitHub PR details, and local files to concatenate them into a large context file and send to a language model (Gemini) for an automated code review.

Table of Contents
Overview
Main Features
Tech Stack
Project Structure
Installation & Setup
Environment Variables
Running the Application
Usage Walkthrough (Wizard Steps)
Common Troubleshooting
Additional Notes
1. Overview
This project is an AI-driven code review assistant. It allows you to:

Fetch JIRA ticket details by ticket number(s).
Fetch GitHub Pull Request details (for both frontend and backend, optionally).
Select relevant local files/folders (in a tree view with checkboxes) and automatically concatenate their contents into one large Markdown file.
Include additional reference files (database schema, business context, coding standards) for context.
Send all this data to a large language model (in this example, Google Gemini) for an automated, structured code review.
The wizard then returns a comprehensive code-review with sections covering critical issues, security checks, performance, business logic alignment, and more.

2. Main Features
Jira Ticket Retrieval

Uses your Jira credentials (via environment variables) to fetch issue details (summary, description) for a given ticket number.
GitHub PR Retrieval

Connects to GitHub (via Personal Access Token) to read the PR’s metadata (title, description) and changed files.
Local File Selection & Concatenation

A local file tree (using rc-tree) is displayed so you can selectively check folders/files to include.
The entire set of checked files is concatenated into a single Markdown document for LLM consumption.
Additional References

The wizard optionally includes “reference files” like your database schema, business context, design & coding standards, etc.
LLM Submission

All the above is combined into a final system prompt sent to the Gemini LLM for an automated, structured code review.
Review Output

The review is displayed back to you with collapsible sections (summary, critical issues, recommendations, etc.).
3. Tech Stack
Front End: React (TypeScript + MUI for styling)
Server: Node.js + Express (runs on localhost:3001 by default)
rc-tree for file-tree exploration.
Axios for HTTP calls to JIRA and GitHub.
Octokit to interact with GitHub’s REST API.
Google Gemini LLM for generating the code review (via an HTTP POST call).
Local File Access: The server portion uses Node/Express to read your local filesystem directories and files (with safety checks).
4. Project Structure
Here is a simplified look at relevant folders & files:

lua
Copy
AICodeReview/
├── nextStep.md
├── .cursorrules
├── README.md              <-- (you can place this readme here)
├── treeViewMigration.md
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
│   ├── utils/
│   ├── components/
│   │   ├── FileTree.tsx
│   │   ├── ReviewWizard.tsx
│   │   └── Steps/         <-- each wizard step is here
│   ├── prompts/
│   ├── services/
│   └── ...
└── ...
Notable Files & Folders
src/server/proxy.js

The primary Node/Express server that handles:
Local file/directory reading (/api/local/directory & /api/local/file).
Jira request endpoint.
The final LLM submission endpoint (/api/generate-review, though the actual LLM call is in LLMService.js).
src/components/Steps/

Each step in the multi-step wizard:
JiraTicketStep.tsx (Step 1)
GitHubPRStep.tsx (Step 2)
FileSelectionStep.tsx (Step 3)
AdditionalFilesStep.tsx (Step 4)
ReviewSubmissionStep.tsx (Step 5)
Step6ReviewResults.tsx (Step 6)
src/components/FileTree.tsx

Renders a recursive file tree using rc-tree.
Allows you to check directories/files, which calls getAllFilesInDirectory(...) for each checked item.
src/services/LLMService.js

The bridging code that constructs a prompt and calls the Gemini LLM endpoint.
src/prompts/systemPrompt.js

Defines how the final system prompt for the LLM is generated (embedding Jira, GitHub, your local files, references, etc.).
src/utils/fileFormatter.ts

Contains logic for concatenating files, adding table of contents, code fences, etc.
Reference files

src/references/databaseSchema.js, businessContext.js, designCodingStandards.js, etc.
Are optionally included for more context in the prompt.
5. Installation & Setup
Below is a typical approach for installing dependencies, for both the client and the server:

Clone or Download this repository.

Install Node.js (v16+ recommended).

From the project root, install dependencies:

bash
Copy
# If you have one combined package.json at the root:
npm install

# If you also have a separate server/package.json:
cd src/server
npm install
Return to the project root if needed:

bash
Copy
cd ../../
6. Environment Variables
You should provide environment variables via a .env file or system environment settings. For local development, a .env in the root of the project is typical.

Example .env (in the project root):

makefile
Copy
# JIRA
REACT_APP_JIRA_API_URL=https://yourdomain.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@example.com
REACT_APP_JIRA_API_TOKEN=XXXXXX # typically a personal access token (PAT) or API token

# GITHUB
REACT_APP_GITHUB_TOKEN=XXXXXX
REACT_APP_GITHUB_OWNER=drjyounger
REACT_APP_GITHUB_REPO=tempstars-app  # or whichever repo

# LLM (Gemini)
REACT_APP_GEMINI_API_KEY=XXXXXX

# For the server
REACT_APP_SERVER_PORT=3001
PORT=3001
Important:

The code references variables like process.env.REACT_APP_JIRA_API_URL, process.env.REACT_APP_GITHUB_TOKEN, process.env.REACT_APP_GEMINI_API_KEY.
Make sure to match these in your .env.
Never commit real tokens to a public repo.
7. Running the Application
Run the Development Server
Typically, you start both the React app and Node server concurrently.

Option A: Use npm run dev if you have a concurrency script in package.json:

bash
Copy
npm run dev
This might do something like:

react-scripts start on port 3000
node src/server/proxy.js on port 3001
Option B: Manually in two terminals:

bash
Copy
# Terminal 1
npm start
# or react-scripts start

# Terminal 2
cd src/server
node proxy.js
# or npm run dev
Open the React App
Go to http://localhost:3000.

The server endpoints (e.g., for local file reading) are on port 3001.
If everything is correct, you’ll see the multi-step wizard in your browser.

8. Usage Walkthrough
The tool is a six-step wizard:

Step 1: Jira Ticket

Enter a single Jira ticket number (e.g., PROJ-123) or (with modifications) multiple.
Click “Fetch Ticket.” The system calls your local Node server, which calls JIRA’s API.
If successful, it shows the ticket summary/description. Press “Next” to continue.
Step 2: GitHub PR

(Optional) Check if you want to fetch a “Frontend” PR or “Backend” PR or both.
Enter the PR number(s) and click “Fetch PR(s).” The code calls GitHub’s REST API via Octokit.
The relevant PR details + changed files appear. Press “Next” to continue.
Step 3: Select Files

Enter a root path (absolute path on your machine) for your local code.
Click “Fetch Directory.” If successful, a file-tree is shown.
Expand directories, check the boxes for any files/folders relevant to your code review.
Checking a folder includes all subfiles (the code does a recursive fetch).
Then press “Concatenate Files” to build a single large markdown doc. You’ll see a preview at the bottom.
Press “Next.”
Step 4: Additional Files

The wizard offers reference files (like DB schema or coding standards).
Check any you want appended to the code review context.
Press “Next.”
Step 5: Submit Review

The wizard assembles the final system prompt (with Jira details, PR details, your concatenated local files, plus references).
Click “Submit Review” to call the Gemini LLM.
Optionally, you can “Preview API Call” to see the prompt text before submission.
Step 6: Review Results

The code review from the LLM is displayed with sections (Summary, Critical Issues, etc.).
You can expand/collapse each section.
From here, you can start a new review or go back to fix anything.
9. Common Troubleshooting
Local File Tree Not Loading

Ensure the absolute path you typed in Step 3 is valid and allowed by isPathSafe(...) in proxy.js.
By default, the server may block certain directories or subfolders (like .ssh, .aws, etc.).
Add your project path to the allowed paths in proxy.js if needed.
Jira or GitHub Calls Failing

Check your .env for valid tokens and base URLs.
Test them with a simple cURL or Postman to confirm.
Gemini LLM

If you see an error: “Gemini API error: Unauthorized,” your REACT_APP_GEMINI_API_KEY might be missing or invalid.
In LLMService.js, confirm GEMINI_API_KEY is set.
Large File Selections

If your directory is huge, selecting it could take a while (the recursion might be slow).
You can filter out large binary files by default; ensure you only include text-based code files.
Local Storage

The wizard uses localStorage for storing step data. If something appears “reset,” check if your browser is clearing local storage.
10. Additional Notes
Security

This tool is meant for local, internal use. The code attempts to disallow reading sensitive OS directories by default.
If you expand its usage or host it online, you’ll need to reinforce path-safety checks and add authentication.
Performance

For extremely large codebases (thousands of files), generating a file tree and reading them all can be slow. You can filter or refine the logic in FileTree.tsx or use partial recursion if needed.
Customize the LLM

The prompt in systemPrompt.js is quite detailed. You can adjust instructions for different styles of code reviews, or integrate another LLM.
Future Plans

Potentially add token-based chunking to avoid LLM context limits if the concatenated file gets too large.
Add more robust error-handling, partial caching, or advanced features like “auto-fix suggestions.”
Conclusion
That’s it! This AI Code Review Assistant tool can speed up your code review process by combining relevant context from Jira, GitHub, and local code to produce a thorough initial review from an LLM. You can then refine or iterate further as needed.

Questions or issues? Open an issue or tweak the code as needed. Good luck!