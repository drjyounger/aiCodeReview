# GitHub Webhook Implementation for AI Code Review Assistant (Mac Mini Setup)

This guide outlines the process of implementing GitHub webhooks to automate code reviews using the AI Code Review Assistant on a local Mac Mini. This setup focuses on local development and testing without cloud deployment.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Mac Mini Setup](#mac-mini-setup)
- [Webhook Implementation Steps](#webhook-implementation-steps)
- [Testing the Webhook](#testing-the-webhook)
- [Maintaining Your Local Setup](#maintaining-your-local-setup)

## Overview

### How GitHub Webhooks Work
GitHub webhooks send HTTP POST payloads to a specified URL when certain events occur in a repository. For our AI Code Review Assistant, we'll configure webhooks to trigger when:
- A pull request is opened
- A pull request is updated with new commits

When these events occur, GitHub will send a payload containing information about the event to our application's webhook endpoint. Our Mac Mini will receive and process these events to generate automated code reviews.

### Architecture Overview
1. User creates or updates a PR in GitHub
2. GitHub sends webhook payload to your Mac Mini's webhook endpoint (tunneled through ngrok)
3. Your Express server receives the payload and validates it
4. The server extracts relevant information (PR number, repository, changed files)
5. It fetches additional context (Jira tickets, local files)
6. The server generates a code review using Gemini LLM
7. The review is posted back to GitHub as a comment on the PR

## Prerequisites

Before implementation, ensure you have:
- Mac Mini with macOS (10.15 Catalina or newer recommended)
- The AI Code Review Assistant project set up and working locally
- A GitHub account with admin access to the target repository
- Node.js and npm installed (v16+ recommended)
  - You can install via Homebrew: `brew install node`
- Basic familiarity with Terminal and Express.js

## Mac Mini Setup

### Step 1: Install and Configure ngrok
First, we need ngrok to expose your Mac Mini's local server to the internet.

1. Install ngrok using Homebrew:
   ```bash
   brew install ngrok
   ```
   
   Alternatively, download from https://ngrok.com/download

2. Sign up for a free ngrok account and get your authtoken

3. Authenticate ngrok with your token:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

### Step 2: Configure Environment Variables
Create or update the `.env` file in your project root:

```env
# GitHub Webhook Settings
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
ENABLE_GITHUB_WEBHOOK=true

# Existing settings
REACT_APP_JIRA_API_URL=https://yourdomain.atlassian.net
REACT_APP_JIRA_EMAIL=your-email@example.com
REACT_APP_JIRA_API_TOKEN=your_jira_token
REACT_APP_GITHUB_TOKEN=your_github_token
REACT_APP_GEMINI_API_KEY=your_gemini_api_key

# Mac Mini specific paths
REACT_APP_FRONTEND_PATH=/Users/yourusername/path/to/frontend/repo
REACT_APP_BACKEND_PATH=/Users/yourusername/path/to/backend/repo
```

### Step 3: Setup Mac Mini for Persistent Service (Optional)
For a more reliable setup on your Mac Mini, consider setting up the service to start automatically:

1. Create a launch agent plist file:
   ```bash
   mkdir -p ~/Library/LaunchAgents
   touch ~/Library/LaunchAgents/com.aicodereview.server.plist
   ```

2. Edit the plist file with the following content:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.aicodereview.server</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/Users/yourusername/path/to/AICodeReview/src/server/proxy.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardErrorPath</key>
       <string>/Users/yourusername/Library/Logs/aicodereview-error.log</string>
       <key>StandardOutPath</key>
       <string>/Users/yourusername/Library/Logs/aicodereview.log</string>
       <key>EnvironmentVariables</key>
       <dict>
           <key>PATH</key>
           <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
           <!-- Add any environment variables needed -->
       </dict>
   </dict>
   </plist>
   ```

3. Load the launch agent:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.aicodereview.server.plist
   ```

### Step 4: Setup ngrok as a Service (Optional)
Similarly, you can set up ngrok to run automatically:

1. Create another launch agent for ngrok:
   ```bash
   touch ~/Library/LaunchAgents/com.aicodereview.ngrok.plist
   ```

2. Add the following content:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.aicodereview.ngrok</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/ngrok</string>
           <string>http</string>
           <string>3001</string>
           <string>--log</string>
           <string>/Users/yourusername/Library/Logs/ngrok.log</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardErrorPath</key>
       <string>/Users/yourusername/Library/Logs/ngrok-error.log</string>
       <key>StandardOutPath</key>
       <string>/Users/yourusername/Library/Logs/ngrok.log</string>
   </dict>
   </plist>
   ```

3. Load the ngrok launch agent:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.aicodereview.ngrok.plist
   ```

4. Create a simple script to fetch the current ngrok URL and update GitHub webhook configuration:
   ```bash
   touch ~/get_ngrok_url.sh
   chmod +x ~/get_ngrok_url.sh
   ```

5. Add this content to the script:
   ```bash
   #!/bin/bash
   curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
   ```

### Step 5: Start Your Local Environment
If not using the launch agents, manually start the services:

1. Start your AI Code Review Assistant application:
   ```bash
   cd /path/to/AICodeReview
   npm run dev
   ```

2. In a separate terminal, start ngrok to expose your Express server:
   ```bash
   ngrok http 3001
   ```
   
3. Note the HTTPS URL provided by ngrok (e.g., `https://a1b2c3d4.ngrok.io`). This will be your webhook URL.

## Webhook Implementation Steps

### Step 1: Create the Webhook Endpoint
Add a new route in your Express server (`src/server/proxy.js`):

```javascript
// Import necessary modules
const crypto = require('crypto');
const bodyParser = require('body-parser');

// Middleware for GitHub webhook
app.use('/api/github-webhook', bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// GitHub webhook endpoint
app.post('/api/github-webhook', async (req, res) => {
  try {
    // 1. Verify the webhook signature
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyGitHubWebhook(req.rawBody, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Unauthorized');
    }

    // 2. Process the webhook event
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    // 3. Check if this is a pull request event we care about
    if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
      // Process the pull request
      await handlePullRequestWebhook(payload);
      res.status(200).send('Processing review');
    } else {
      // We're not interested in this event
      res.status(200).send('Event ignored');
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Function to verify the GitHub webhook signature
function verifyGitHubWebhook(payload, signature) {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) return false;
  
  const sig = Buffer.from(signature, 'utf8');
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'), 'utf8');
  
  return crypto.timingSafeEqual(digest, sig);
}
```

### Step 2: Implement Pull Request Handler
Create a new file `src/server/utils/webhookHandler.js` that will process webhook payloads:

```javascript
// Implementation details for extracting PR information and generating reviews
// (This should be similar to the implementation in the original plan)
```

The implementation should:
1. Extract information from the webhook payload
2. Extract Jira ticket IDs from PR
3. Fetch Jira ticket details
4. Fetch PR file changes
5. Generate LLM review
6. Post review back to GitHub

### Step 3: Adapt Existing Services
Modify your current services to work in a headless (non-UI) context, focusing on Mac compatibility:

1. Ensure file paths use Mac OS conventions (forward slashes)
2. Test all functionality with macOS file permission model
3. Handle local file access properly for your Mac Mini user account

## Setting Up GitHub Webhook

### Step 1: Register the Webhook in GitHub
1. Go to your GitHub repository
2. Click on "Settings" > "Webhooks" > "Add webhook"
3. Configure the webhook:
   - Payload URL: Your ngrok URL + `/api/github-webhook` (e.g., `https://a1b2c3d4.ngrok.io/api/github-webhook`)
   - Content type: `application/json`
   - Secret: Same value as your `GITHUB_WEBHOOK_SECRET` environment variable
   - Events: Select "Pull requests" only
   - Active: Check this box

4. Click "Add webhook"

### Step 2: Create a Script to Update the Webhook URL
Since ngrok's free tier generates a new URL each time it starts, create a script to update your GitHub webhook:

```bash
#!/bin/bash
# update_webhook.sh

# Get current ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$NGROK_URL" ]; then
  echo "Error: ngrok not running or no tunnel available"
  exit 1
fi

# GitHub repository details
OWNER="your-github-username"
REPO="your-repo-name"
WEBHOOK_ID="your-webhook-id"  # Get this from GitHub webhook settings page URL

# Personal access token with repo and admin:repo_hook permissions
GITHUB_TOKEN="your-github-token"

# Update the webhook
curl -X PATCH \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -d "{\"config\": {\"url\": \"$NGROK_URL/api/github-webhook\"}}" \
  "https://api.github.com/repos/$OWNER/$REPO/hooks/$WEBHOOK_ID"

echo "Updated webhook URL to: $NGROK_URL/api/github-webhook"
```

Save this script and make it executable:
```bash
chmod +x update_webhook.sh
```

Run it after starting ngrok to update your webhook URL.

## Testing the Webhook

### Manual Testing on Mac Mini
1. Ensure your Express server and ngrok are running on your Mac Mini
2. Create a new pull request in your GitHub repository
3. Check your server logs:
   ```bash
   tail -f ~/Library/Logs/aicodereview.log
   ```
4. Verify that a review comment is posted on the PR

### Mac-Specific Debugging
1. Use the macOS Console app to view system logs
2. Check for any permission issues that might be affecting local file access
3. Use the Activity Monitor to ensure your Node.js process has sufficient resources

### Troubleshooting Mac Mini Issues
1. **Sleep Mode:** Ensure your Mac Mini doesn't go to sleep by adjusting Energy Saver settings
2. **Network:** Ensure your Mac Mini has a reliable network connection
3. **Permissions:** Check that your user account has the necessary permissions for all operations

## Maintaining Your Local Setup

### System Maintenance
1. Keep your Mac Mini updated with the latest security patches
2. Regularly back up your webhook implementation and configuration
3. Monitor disk space and system resources with macOS utilities

### Restarting Services After Mac Reboot
If not using launch agents, create a simple script to restart everything:

```bash
#!/bin/bash
# startup.sh

# Start the AI Code Review server
cd /path/to/AICodeReview
nohup npm run dev > ~/aicodereview-server.log 2>&1 &

# Start ngrok
nohup ngrok http 3001 > ~/ngrok.log 2>&1 &

# Wait for ngrok to start
sleep 5

# Update webhook URL
~/update_webhook.sh
```

Make this script executable and run it after system reboots:
```bash
chmod +x startup.sh
```

### Logging and Monitoring on macOS
1. Use macOS's built-in logging system:
   ```bash
   log stream --predicate 'process == "node"'
   ```

2. Create a simple status check script:
   ```bash
   #!/bin/bash
   # check_status.sh

   # Check if server is running
   if pgrep -f "node.*proxy.js" > /dev/null; then
     echo "✅ Server is running"
   else
     echo "❌ Server is NOT running"
   fi

   # Check if ngrok is running
   if pgrep -f "ngrok" > /dev/null; then
     echo "✅ ngrok is running"
     NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
     echo "   URL: $NGROK_URL"
   else
     echo "❌ ngrok is NOT running"
   fi
   ```

## Conclusion

This implementation plan provides a Mac Mini-specific approach to setting up GitHub webhooks with your AI Code Review Assistant. By following these steps, you'll create a reliable local webhook receiver that can automatically process pull requests and generate code reviews.

The Mac Mini setup offers several advantages:
- Always-on operation without cloud service costs
- Complete control over your environment and data
- Ability to customize the review process for your specific needs

Remember that if your Mac Mini restarts or ngrok gets disconnected, you'll need to update your webhook URL in GitHub. Using the provided launch agents and scripts can help automate this process.

This local setup provides all the core functionality of the AI Code Review assistant while keeping everything within your control on your Mac Mini.
