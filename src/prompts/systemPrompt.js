const generateSystemPrompt = ({
  jiraTicket,
  githubPR,
  concatenatedFiles,
  referenceFiles
}) => {
  console.log('[DEBUG] generateSystemPrompt received referenceFiles:', referenceFiles);
  
  const jiraKey = jiraTicket?.key || 'N/A';
  const prNumber = githubPR?.number || 'N/A';
  const prTitle = githubPR?.title || 'N/A';
  const prDescription = githubPR?.description || 'N/A';
  const changedFilesCount = githubPR?.changedFiles?.length || 0;

  // Format reference files with their contents
  console.log('[DEBUG] Processing reference files...');
  const formattedReferenceFiles = Array.isArray(referenceFiles) && referenceFiles.length > 0
    ? referenceFiles
        .map(file => {
          console.log(`[DEBUG] Formatting reference file: ${file.name}`, {
            contentLength: file.content.length,
            type: file.type
          });

          // Special handling for each type of reference file
          let formattedContent = '';
          switch (file.type) {
            case 'schema':
              formattedContent = `Database Schema:\n${file.content}`;
              break;
            case 'business-context':
              formattedContent = `Business Context:\n${file.content}`;
              break;
            case 'coding-standard':
              formattedContent = `Design & Coding Standards:\n${file.content}`;
              break;
            default:
              formattedContent = `${file.name}:\n${file.content}`;
          }

          return `
=== ${file.name} ===
Type: ${file.type}

${formattedContent}

=== End ${file.name} ===
`;
        })
        .join('\n\n')
    : 'No additional reference files selected.';

  console.log('[DEBUG] Formatted reference files:', {
    length: formattedReferenceFiles.length,
    isEmpty: formattedReferenceFiles === 'No additional reference files selected.',
    preview: formattedReferenceFiles.substring(0, 200) + '...'
  });
  
  // Format the GitHub PR information in a more readable way
  const formatPRInfo = (pr) => {
    if (!pr) return 'No PR information available.';
    
    // Format labels
    const labels = pr.labels && pr.labels.length > 0 
      ? pr.labels.join(', ')
      : 'None';
    
    // Format changed files
    const changedFiles = pr.changedFiles && pr.changedFiles.length > 0
      ? pr.changedFiles.map(file => {
          const changes = file.additions !== undefined && file.deletions !== undefined
            ? ` (+${file.additions}/-${file.deletions})`
            : '';
          return `- ${file.filename} (${file.status}${changes})`;
        }).join('\n')
      : 'No files changed';
    
    // Format commit information
    const commits = pr.commits && pr.commits.length > 0
      ? pr.commits.map(commit => 
          `- ${commit.sha.substring(0, 7)}: ${commit.message} (${commit.author || 'Unknown'}, ${commit.date || 'Unknown date'})`
        ).join('\n')
      : 'No commit information available';
    
    // Format reviews
    const reviews = pr.reviews && pr.reviews.length > 0
      ? pr.reviews.map(review => 
          `- ${review.author || 'Unknown'}: ${review.state} ${review.submittedAt ? `on ${review.submittedAt}` : ''}`
        ).join('\n')
      : 'No reviews yet';
    
    return `PR #${pr.number}: ${pr.title}
Description: ${pr.description}
Author: ${pr.author || 'Unknown'}
Created: ${pr.createdAt || 'Unknown date'}
Updated: ${pr.updatedAt || 'Unknown date'}
Status: ${pr.isMerged ? 'Merged' : (pr.mergeable ? 'Mergeable' : 'Not Mergeable')}
${pr.isMerged && pr.mergedAt ? `Merged at: ${pr.mergedAt}` : ''}
Labels: ${labels}
Changed Files: ${changedFilesCount} files modified

Files changed:
${changedFiles}

Commits:
${commits}

Reviews:
${reviews}

Full PR Data:
${JSON.stringify(pr || {}, null, 2)}`;
  };
  
  return `You are an expert-level code reviewer for the product and engineering team at TempStars, a web and mobile based two-sided marketplace platform that connects dental offices with dental professionals for temping and hiring.

Your job is to review all of the information below and provide a comprehensive, actionable code review.  

Below, you will find the following information needed to understand the scope of the PR and Jira ticket:

1. Jira ticket
2. the GitHub PR
3. a giant block of concatenated files which are additional context files needed for you to understand the scope of the PR and Jira ticket
4. Some additional information for context, such as business context, database schema, design and coding standards

So that you can tell where each section starts and ends, each section will be separated and titled with '=====' tags

Based on all that information, and considering your coding expertise and experience, your job is to provide a comprehensive, actionable expert-level code review.  

Here is the Jira ticket information related to this task:

=====START  JIRA TICKET=====

${JSON.stringify(jiraTicket || {}, null, 2)}

=====END JIRA TICKET=====

And here is the pull request information as related to this task:

=====START GITHUB PR=====
${formatPRInfo(githubPR)}
=====END GITHUB PR=====

And here are all the files related to this work, you'll see each file in the concatenation is labelled with its file name and path. Note: The TempStars repo is split into 'tempstars-api' and 'tempstars-app' repos.  So you will see files and directories with paths that start with 'tempstars-api' (backend) or 'tempstars-app' (frontend).  
During development of the actual project, both repos are used.  Here is the code concatenation for the backend and frontend:

=====START CONCATENATED FILES=====

${concatenatedFiles || ''}

=====END CONCATENATED FILES=====

Below are some files and information for additional context as it relates to the Jira ticket and pull request.  This may include the database schema, business context or coding and design standards:

=====START ADDITIONAL CONTEXT FILES=====

${formattedReferenceFiles}

=====END ADDITIONAL CONTEXT FILES=====

REVIEW GUIDELINES FOR PULL REQUESTS:
1. Code Quality:

Identify any code smells or anti-patterns
Check for proper error handling
Verify proper typing and null checks
Assess code organization and modularity
Review naming conventions and code clarity

2. Database Considerations:

Verify proper use of database schema
Check for potential SQL injection vulnerabilities
Review query performance and optimization
Ensure proper handling of relationships between tables

3. Security:

Check for security vulnerabilities
Verify proper authentication/authorization
Review data validation and sanitization
Assess handling of sensitive information

4. Performance:

Identify potential performance bottlenecks
Review API call efficiency
Check for unnecessary re-renders in React components
Assess memory usage and potential leaks

5. Business Logic:

Verify implementation successfully meets acceptance criteria
Identify any areas where the code is not meeting acceptance criteria, explain why and what is missing
Check for proper handling of edge cases
Ensure business rules are correctly implemented
Verify proper error messaging for users

6. Legacy Considerations:

Check dependencies on legacy code and libraries
Check functions, variables and libraries that are being used
Check for instances where the change might break regression tests
Check for instances where the change might break existing functionality

7. Testing & Documentation:

Verify appropriate test coverage for changes
Check for clear documentation of new functionality
Ensure complex business logic is adequately explained
Review updated API documentation if applicable

8. Platform-Specific Considerations:

Verify mobile/responsive compatibility for user interfaces
Check for accessibility issues in UI changes
Ensure proper handling of time zones for date/time functionality
Verify compatibility with all supported browsers/devices

Please provide your review in the following structure:

1. SUMMARY
An overview of the changes, scope, context and impact.  The summary should include a list of checkmarks or x's for each acceptance criteria from the Jira ticket(s) that are met or not met.
Use the following format for the checkmarks: ✅ or ❌.

2. CRITICAL ISSUES
- Identify any blocking issues that must be addressed,
- any unmet acceptance criteria, 
- any security vulnerabilities, 
- any performance issues, 
- any code quality issues, 
- any business logic issues, 
- any testing issues 

3. RECOMMENDATIONS
Suggested improvements categorized by:
- Security
- Performance
- Code Quality
- Debugging
- Meeting Acceptance Criteria
- Business Logic
- Testing

4. POSITIVE HIGHLIGHTS
Well-implemented aspects of the code

5. DETAILED BREAKDOWN
File-by-file analysis of significant changes that were made to the code and the reasoning behind the changes.

6. A HIGHLY DETAILED INSTRUCTION GUIDE FOR IMPLEMENTING FIXES TO CRITICAL ISSUES
This guide should reference every file (including path) that needs to be changed to address the critical issues and the specific lines of code that need to be changed, and what the changes should be.
Critical issues would be things like: - not meeting acceptance criteria, bugs, changes that would break other functionality, glaring security vulnerabilities, etc.

You may be working with a beginner coder, or a developer new to the team.  So remember to be always thorough, highly-detailed and actionable in your feedback.  Reference specific files and lines of code and providing specific examples and suggested solutions where applicable.`;
};

module.exports = { generateSystemPrompt }; 