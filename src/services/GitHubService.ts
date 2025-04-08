import { Octokit } from '@octokit/rest';
import { GitHubPR, ApiResponse } from '../types';

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const REPO_OWNER = process.env.REACT_APP_GITHUB_OWNER;
const REPO_NAME = process.env.REACT_APP_GITHUB_REPO;

console.log('Environment variables check:', {
  tokenExists: !!process.env.REACT_APP_GITHUB_TOKEN,
  tokenLength: process.env.REACT_APP_GITHUB_TOKEN?.length,
  owner: process.env.REACT_APP_GITHUB_OWNER,
  repo: process.env.REACT_APP_GITHUB_REPO
});

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  log: console,
});

export const getPullRequestDetails = async (
  prNumber: number,
  owner: string,
  repo: string
): Promise<ApiResponse<GitHubPR>> => {
  if (!GITHUB_TOKEN) {
    return {
      success: false,
      error: 'GitHub token is not configured. Please check your environment variables.',
    };
  }

  console.log('GitHub API Config:', {
    hasToken: !!GITHUB_TOKEN,
    owner,
    repo,
    prNumber
  });

  try {
    // Fetch PR details
    const { data: prData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR files
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR review comments
    const { data: reviewComments } = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR commits
    const { data: commits } = await octokit.pulls.listCommits({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR reviews
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    const pullRequest: GitHubPR = {
      number: prData.number,
      title: prData.title,
      description: prData.body || '',
      repo: { owner, name: repo },
      changedFiles: files.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        patch: file.patch,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
      })),
      author: prData.user?.login,
      createdAt: prData.created_at,
      updatedAt: prData.updated_at,
      isMerged: Boolean(prData.merged_at),
      mergedAt: prData.merged_at,
      mergeable: prData.mergeable ?? undefined,
      labels: prData.labels?.map(label => label.name) || [],
      commits: commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name,
        date: commit.commit.author?.date,
      })),
      reviewComments: reviewComments.map(comment => ({
        id: comment.id,
        body: comment.body,
        path: comment.path,
        position: comment.position,
        author: comment.user?.login,
        createdAt: comment.created_at,
      })),
      reviews: reviews.map(review => ({
        id: review.id,
        state: review.state,
        author: review.user?.login,
        body: review.body,
        submittedAt: review.submitted_at,
      })),
    };

    return {
      success: true,
      data: pullRequest,
    };
  } catch (error) {
    console.error('Error fetching GitHub PR:', error);
    return {
      success: false,
      error: 'Failed to fetch GitHub pull request details',
    };
  }
};

export const getFileContent = async (filePath: string, ref: string): Promise<ApiResponse<string>> => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER!,
      repo: REPO_NAME!,
      path: filePath,
      ref,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString();
      return {
        success: true,
        data: content,
      };
    }

    throw new Error('Not a file');
  } catch (error) {
    console.error('Error fetching file content:', error);
    return {
      success: false,
      error: 'Failed to fetch file content',
    };
  }
};
