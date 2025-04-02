// src/components/Steps/FileSelectionStep.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Tabs,
  Tab,
  Chip,
  Divider,
} from '@mui/material';

import { FileTree } from '../FileTree';
import { GitHubPR, GitHubFile, PRDetails } from '../../types';
import { formatConcatenatedFiles } from '../../utils';
import { getRepoConfigs, saveRepoPath, ReposConfig } from '../../utils/repoConfig';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`repo-tabpanel-${index}`}
      aria-labelledby={`repo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const FileSelectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [repoConfigs, setRepoConfigs] = useState<ReposConfig>({});
  const [repoKeys, setRepoKeys] = useState<string[]>([]);
  
  const [rootPaths, setRootPaths] = useState<Record<string, string>>({});
  const [showTrees, setShowTrees] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prs, setPRs] = useState<PRDetails>({});
  const [concatenatedContent, setConcatenatedContent] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Pre-populate paths from localStorage
  useEffect(() => {
    const configs = getRepoConfigs();
    setRepoConfigs(configs);
    
    const keys = Object.keys(configs);
    setRepoKeys(keys);
    
    // Initialize rootPaths from saved paths in configs
    const initialPaths = keys.reduce((acc, key) => {
      acc[key] = configs[key].localPath || '';
      return acc;
    }, {} as Record<string, string>);
    
    setRootPaths(initialPaths);
    
    // Initialize showTrees
    const initialShowTrees = keys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
    
    setShowTrees(initialShowTrees);
    
    // Load PR data
    try {
      const prData = localStorage.getItem('githubPRs');
      if (prData) {
        setPRs(JSON.parse(prData));
      }
    } catch (err) {
      console.error('Error loading PR data:', err);
    }
  }, []);

  const currentRepoKey = repoKeys[currentTab] || '';

  const changedFiles = useMemo(() => {
    if (!currentRepoKey || !prs[currentRepoKey]) return [];
    return prs[currentRepoKey]?.changedFiles || [];
  }, [prs, currentRepoKey]);

  const handlePathChange = (repoKey: string, value: string) => {
    setRootPaths(prev => ({
      ...prev,
      [repoKey]: value
    }));
    
    setShowTrees(prev => ({
      ...prev,
      [repoKey]: false
    }));
    
    setError(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleFetchDirectory = (repoKey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const path = rootPaths[repoKey]?.trim();
      if (!path) {
        throw new Error(`Please enter a valid root directory path for ${repoConfigs[repoKey]?.description || repoKey}`);
      }

      console.log(`Fetching directory for ${repoKey} path:`, path);
      
      // Save the path in config for future use
      saveRepoPath(repoKey, path);
      
      setShowTrees(prev => ({
        ...prev,
        [repoKey]: true
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid path');
      setShowTrees(prev => ({
        ...prev,
        [repoKey]: false
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: string[]) => {
    console.log('Selected files:', files);
    setSelectedFiles(files);
  };

  const handleConcatenate = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      // Function to get file content
      const getFileContent = async (filePath: string): Promise<string> => {
        try {
          const response = await fetch('/api/local/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath })
          });
          
          const data = await response.json();
          if (!data.success) throw new Error(data.error);
          return data.content;
        } catch (err) {
          console.error(`Error fetching content for ${filePath}:`, err);
          return `// Error loading content for ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        }
      };

      const finalContent = await formatConcatenatedFiles(selectedFiles, getFileContent);
      setConcatenatedContent(finalContent);
      setShowSuccess(true);
      
      // Store in localStorage for next step
      localStorage.setItem('concatenatedFiles', finalContent);

      // Scroll to the concatenated content
      setTimeout(() => {
        document.getElementById('concatenated-content')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err instanceof Error 
        ? `Failed to process selected files: ${err.message}` 
        : 'Failed to process selected files');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (concatenatedContent) {
      localStorage.setItem('concatenatedFiles', concatenatedContent);
      navigate('/additional-files');
    } else {
      setError('Please concatenate files before proceeding');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 3: Select Files for Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Files successfully concatenated! Scroll down to view the result.
        </Alert>
      )}
      
      <Typography variant="subtitle1" gutterBottom>
        Select repository workspace:
      </Typography>

      {/* Repository tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="repository tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {repoKeys.map((key, index) => (
            <Tab 
              key={key} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {repoConfigs[key]?.description || key}
                  {prs[key] && (
                    <Chip 
                      label={`PR #${prs[key]?.number}`} 
                      size="small" 
                      sx={{ ml: 1 }} 
                      color="primary"
                    />
                  )}
                </Box>
              } 
              id={`repo-tab-${index}`}
              aria-controls={`repo-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Repository content panels */}
      {repoKeys.map((repoKey, index) => (
        <TabPanel key={repoKey} value={currentTab} index={index}>
          <Box component="form" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Root Directory Path for {repoConfigs[repoKey]?.description || repoKey}
            </Typography>
            <TextField
              fullWidth
              value={rootPaths[repoKey] || ''}
              onChange={(e) => handlePathChange(repoKey, e.target.value)}
              placeholder="/path/to/your/project"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={() => handleFetchDirectory(repoKey)}
              disabled={loading || !(rootPaths[repoKey]?.trim())}
            >
              {loading ? <CircularProgress size={24} /> : 'Fetch Directory'}
            </Button>
          </Box>

          {showTrees[repoKey] && !error && (
            <Box sx={{ mb: 3, height: '400px', overflow: 'auto' }}>
              <FileTree
                rootPath={rootPaths[repoKey] || ''}
                onSelect={handleFileSelect}
                changedFiles={repoKey === currentRepoKey ? changedFiles : []}
                onError={(error: Error) => setError(error.message)}
              />
            </Box>
          )}
        </TabPanel>
      ))}

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/github-pr')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleConcatenate}
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : 'Concatenate Files'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || !concatenatedContent}
        >
          Next
        </Button>
      </Box>

      {/* Display selected files count */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </Typography>
        </Box>
      )}

      {/* Display concatenated content */}
      {concatenatedContent && (
        <Box sx={{ mt: 2 }} id="concatenated-content">
          <Typography variant="h6" gutterBottom>
            Concatenated Files
          </Typography>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
            border: '1px solid #e0e0e0'
          }}>
            {concatenatedContent}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default FileSelectionStep;

