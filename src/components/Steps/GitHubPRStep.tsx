import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { getPullRequestDetails } from '../../services/GitHubService';
import { PRDetails } from '../../types';
import { saveGitHubPRs, getGitHubPRs } from '../../utils/storage';
import { getRepoConfigs, ReposConfig, RepoConfig } from '../../utils/repoConfig';

const GitHubPRStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoConfigs, setRepoConfigs] = useState<ReposConfig>({});
  
  const [prs, setPRs] = useState<Record<string, { number: string; selected: boolean }>>({});

  const [prDetails, setPrDetails] = useState<PRDetails>({});

  // Initialize prs state from repoConfigs
  useEffect(() => {
    const configs = getRepoConfigs();
    setRepoConfigs(configs);
    
    // Initialize prs state with all repos from config
    const initialPrs = Object.keys(configs).reduce((acc, key) => {
      acc[key] = { number: '', selected: false };
      return acc;
    }, {} as Record<string, { number: string; selected: boolean }>);
    
    setPRs(initialPrs);
    
    // Try to load previous PR details if available
    const savedPRs = getGitHubPRs();
    if (savedPRs) {
      setPrDetails(savedPRs);
    }
  }, []);

  const handleFetchPRs = async () => {
    console.log('[client] [Step2:GitHubPR] Starting PR fetch with:', prs);
    setLoading(true);
    setError(null);
    
    try {
      const updatedPRDetails: PRDetails = {};

      // Validate environment variables first
      if (!process.env.REACT_APP_GITHUB_TOKEN) {
        throw new Error('GitHub token is not configured. Please check your .env file.');
      }

      const promises = [];

      // Handle each selected repo
      for (const [repoKey, prInfo] of Object.entries(prs)) {
        if (prInfo.selected && prInfo.number) {
          const repoConfig = repoConfigs[repoKey];
          if (!repoConfig) {
            console.warn(`No configuration found for repo key: ${repoKey}`);
            continue;
          }
          
          console.log(`[client] [Step2:GitHubPR] Fetching ${repoKey} PR #${prInfo.number}...`);
          promises.push(
            getPullRequestDetails(
              parseInt(prInfo.number), 
              repoConfig.owner, 
              repoConfig.name
            ).then(result => {
              if (result.success && result.data) {
                updatedPRDetails[repoKey] = result.data;
              } else {
                throw new Error(`${repoKey.charAt(0).toUpperCase() + repoKey.slice(1)} PR Error: ${result.error}`);
              }
            })
          );
        }
      }

      if (promises.length === 0) {
        throw new Error('Please select at least one PR to review');
      }

      await Promise.all(promises);
      console.log('[client] [Step2:GitHubPR] Final PR Details:', updatedPRDetails);
      setPrDetails(updatedPRDetails);

    } catch (err) {
      console.error('[client] [Step2:GitHubPR] Error:', err);
      // More detailed error handling
      let errorMessage = '';
      
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
        if (err.stack) {
          // Include first few lines of stack for context without overwhelming
          const stackLines = err.stack.split('\n').slice(0, 3).join('\n');
          errorMessage += `\n\nDetails: ${stackLines}`;
        }
      } else {
        errorMessage = 'Failed to fetch PR details: Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Make sure we have at least one PR fetched
    if (Object.keys(prDetails).length > 0) {
      saveGitHubPRs(prDetails);
      navigate('/file-selection');
    } else {
      setError('Please fetch at least one PR before continuing');
    }
  };

  const handleInputChange = (repoKey: string, value: string) => {
    setPRs(prev => ({
      ...prev,
      [repoKey]: { ...prev[repoKey], number: value }
    }));
  };

  const handleCheckboxChange = (repoKey: string) => {
    setPRs(prev => ({
      ...prev,
      [repoKey]: { ...prev[repoKey], selected: !prev[repoKey].selected }
    }));
  };

  // Format PR details for display
  const renderPRDetails = () => {
    if (Object.keys(prDetails).length === 0) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>PR Details</Typography>
        
        {Object.entries(prDetails).map(([repoKey, details]) => (
          <Box key={repoKey} sx={{ mb: 3, borderLeft: '3px solid #1976d2', pl: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={repoConfigs[repoKey]?.description || repoKey} 
                color="primary" 
                size="small" 
                sx={{ mr: 1 }}
              />
              <Typography variant="subtitle1" fontWeight="bold">
                PR #{details.number}: {details.title}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Description:</strong> {details.description || 'No description provided'}
            </Typography>
            
            <Typography variant="body2">
              <strong>Changed Files:</strong> {details.changedFiles?.length || 0} files
            </Typography>
            
            {details.changedFiles && details.changedFiles.length > 0 && (
              <Box sx={{ mt: 1, maxHeight: '200px', overflow: 'auto' }}>
                {details.changedFiles.map((file, index) => (
                  <Chip 
                    key={index}
                    label={file.filename} 
                    size="small" 
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 2: GitHub Pull Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error}
          </pre>
        </Alert>
      )}

      {/* Repository Selection */}
      <Typography variant="subtitle1" gutterBottom>
        Select repositories to review:
      </Typography>
      
      {Object.entries(repoConfigs).map(([key, config]) => (
        <Box key={key} sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={prs[key]?.selected || false}
                onChange={() => handleCheckboxChange(key)}
              />
            }
            label={config.description || key}
          />
          {prs[key]?.selected && (
            <TextField
              fullWidth
              label="PR Number"
              value={prs[key]?.number || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              sx={{ mt: 1 }}
              disabled={loading}
              placeholder="Enter PR number"
            />
          )}
        </Box>
      ))}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/jira-ticket')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleFetchPRs}
          disabled={loading || !Object.values(prs).some(pr => pr.selected)}
        >
          {loading ? <CircularProgress size={20} /> : 'Fetch PR(s)'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || Object.keys(prDetails).length === 0}
        >
          Next
        </Button>
      </Box>

      {/* Display fetched PR details */}
      {renderPRDetails()}
    </Paper>
  );
};

export default GitHubPRStep; 