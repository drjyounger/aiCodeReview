export interface RepoConfig {
  owner: string;
  name: string;
  localPath?: string;
  description: string;
}

export interface ReposConfig {
  [key: string]: RepoConfig;
}

// Default configurations that can be overridden by environment variables
const REPOS: ReposConfig = {
  frontend: {
    owner: process.env.REACT_APP_FRONTEND_OWNER || 'drjyounger',
    name: process.env.REACT_APP_FRONTEND_REPO || 'tempstars-app',
    localPath: process.env.REACT_APP_FRONTEND_PATH || '',
    description: 'Frontend (React/TypeScript)'
  },
  backend: {
    owner: process.env.REACT_APP_BACKEND_OWNER || 'drjyounger',
    name: process.env.REACT_APP_BACKEND_REPO || 'tempstars-api',
    localPath: process.env.REACT_APP_BACKEND_PATH || '',
    description: 'Backend (Node.js)'
  }
};

// Get user's recently used paths from localStorage
const loadSavedPaths = (): ReposConfig => {
  try {
    const savedConfig = localStorage.getItem('repoConfig');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig) as ReposConfig;
      // Merge with defaults but don't override environment variables
      return Object.entries(REPOS).reduce((config, [key, defaultValue]) => {
        const savedValue = parsedConfig[key] || {};
        config[key] = {
          ...defaultValue,
          // Only use saved localPath if there's no environment variable
          localPath: process.env[`REACT_APP_${key.toUpperCase()}_PATH`] || 
                     savedValue.localPath || 
                     defaultValue.localPath
        };
        return config;
      }, {} as ReposConfig);
    }
  } catch (error) {
    console.error('Failed to load saved repo configurations:', error);
  }
  return REPOS;
};

// Save user's path selections to localStorage
export const saveRepoPath = (repoKey: string, path: string): void => {
  try {
    const currentConfig = loadSavedPaths();
    currentConfig[repoKey] = {
      ...currentConfig[repoKey],
      localPath: path
    };
    localStorage.setItem('repoConfig', JSON.stringify(currentConfig));
  } catch (error) {
    console.error('Failed to save repo path:', error);
  }
};

export const getRepoConfigs = (): ReposConfig => loadSavedPaths(); 