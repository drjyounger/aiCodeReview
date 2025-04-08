// Jira related types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
}

// GitHub related types
export interface GitHubFile {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  patch: string | undefined;
  additions?: number;
  deletions?: number;
  changes?: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author?: string;
  date?: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  path?: string;
  position?: number;
  author?: string;
  createdAt?: string;
}

export interface GitHubReview {
  id: number;
  state: string;
  author?: string;
  body?: string;
  submittedAt?: string;
}

export interface GitHubPR {
  title: string;
  description: string;
  number: number;
  repo: {
    owner: string;
    name: string;
  };
  changedFiles: GitHubFile[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  isMerged?: boolean;
  mergedAt?: string;
  mergeable?: boolean;
  labels?: string[];
  commits?: GitHubCommit[];
  reviewComments?: GitHubComment[];
  reviews?: GitHubReview[];
}

// Updated to support dynamic repository keys
export interface PRDetails {
  [key: string]: GitHubPR | null;
}

// For backward compatibility
export interface LegacyPRDetails {
  frontend: GitHubPR | null;
  backend: GitHubPR | null;
}

// File selection types
export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  selected?: boolean;
}

// Review context types
export interface ReviewContext {
  jiraTickets: JiraTicket[];
  githubPR: GitHubPR | null;
  selectedFiles: string[];
  additionalFiles: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 