import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { generateCodeReview } from '../../services/LLMService';
import { REFERENCE_FILES } from '../../references/referenceManifest';
import { getRepoConfigs } from '../../utils/repoConfig';

interface ReferenceFileContent {
  type: string;
  name: string;
  content: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
}

const ReviewSubmissionStep: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string>('');
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const addLog = (level: 'info' | 'warn' | 'error', message: string, details?: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prevLogs => [...prevLogs, { timestamp, level, message, details }]);
  };
  
  // Load repository configurations
  useEffect(() => {
    const repoConfigs = getRepoConfigs();
    addLog('info', 'Loaded repository configurations', JSON.stringify(repoConfigs));
    
    // Verify we have required data from previous steps
    try {
      const concatenatedFiles = localStorage.getItem('concatenatedFiles');
      if (!concatenatedFiles) {
        navigate('/file-selection');
        return;
      }
      addLog('info', 'Found concatenated files', `${concatenatedFiles.length} characters`);
      
      const jiraTicket = localStorage.getItem('jiraTicket');
      addLog('info', jiraTicket 
        ? 'Found Jira ticket data' 
        : 'No Jira ticket data found');
        
      const githubPRs = localStorage.getItem('githubPRs');
      addLog('info', githubPRs 
        ? 'Found GitHub PR data' 
        : 'No GitHub PR data found');
      
      const referenceContents = localStorage.getItem('referenceContents');
      addLog('info', referenceContents 
        ? `Found reference contents: ${Object.keys(JSON.parse(referenceContents)).length} files` 
        : 'No reference contents found');
    } catch (err) {
      addLog('error', 'Error checking previous step data', err instanceof Error ? err.message : 'Unknown error');
      setError('Error loading data from previous steps. Please go back and try again.');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    addLog('info', 'Starting LLM submission process');
    
    try {
      let jiraTicket = null;
      let githubPR = null;
      let concatenatedFiles = '';
      let referenceContents = {};
      
      // Load all required data with proper error handling
      try {
        const jiraData = localStorage.getItem('jiraTicket');
        if (jiraData) {
          jiraTicket = JSON.parse(jiraData);
          addLog('info', 'Loaded Jira ticket data', `Key: ${jiraTicket.key}`);
        } else {
          addLog('warn', 'No Jira ticket data found');
        }
      } catch (err) {
        addLog('error', 'Error parsing Jira data', err instanceof Error ? err.message : 'Unknown error');
      }
      
      try {
        const prData = localStorage.getItem('githubPRs');
        if (prData) {
          githubPR = JSON.parse(prData);
          addLog('info', 'Loaded GitHub PR data', `Repos: ${Object.keys(githubPR).join(', ')}`);
        } else {
          addLog('warn', 'No GitHub PR data found');
        }
      } catch (err) {
        addLog('error', 'Error parsing GitHub PR data', err instanceof Error ? err.message : 'Unknown error');
      }
      
      try {
        concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
        addLog('info', 'Loaded concatenated files', `${concatenatedFiles.length} characters`);
        
        if (!concatenatedFiles) {
          throw new Error('No concatenated files found');
        }
      } catch (err) {
        addLog('error', 'Error loading concatenated files', err instanceof Error ? err.message : 'Unknown error');
        throw new Error('Failed to load concatenated files');
      }
      
      try {
        const refData = localStorage.getItem('referenceContents');
        if (refData) {
          referenceContents = JSON.parse(refData);
          addLog('info', 'Loaded reference contents', `${Object.keys(referenceContents).length} files`);
        } else {
          addLog('warn', 'No reference contents found');
        }
      } catch (err) {
        addLog('error', 'Error parsing reference contents', err instanceof Error ? err.message : 'Unknown error');
      }

      // Convert referenceContents into the format expected by the LLM
      const validReferenceFiles: ReferenceFileContent[] = Object.entries(referenceContents).map(([fileId, content]) => {
        const referenceFile = REFERENCE_FILES.find(f => f.id === fileId);
        return {
          type: referenceFile?.type || 'unknown',
          name: referenceFile?.name || fileId,
          content: content as string
        };
      });

      addLog('info', 'Sending data to LLM API', `Reference files: ${validReferenceFiles.length}`);
      
      const review = await generateCodeReview({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles: validReferenceFiles
      });

      if (review.success) {
        addLog('info', 'Successfully received code review', `${review.data.length} characters`);
        localStorage.setItem('reviewResult', JSON.stringify({
          review: review.data,
          suggestions: [],
          score: 0
        }));
        navigate('/review-result');
      } else {
        throw new Error(review.error || 'Unknown error generating review');
      }
    } catch (err) {
      addLog('error', 'Error in review submission', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error 
        ? `Failed to generate review: ${err.message}` 
        : 'Failed to generate review');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPrompt = () => {
    setLoading(true);
    
    try {
      addLog('info', 'Generating prompt preview');
      let jiraTicket = null;
      let githubPR = null;
      let concatenatedFiles = '';
      let referenceContents = {};
      
      try {
        const jiraData = localStorage.getItem('jiraTicket');
        if (jiraData) jiraTicket = JSON.parse(jiraData);
      } catch (err) {
        addLog('error', 'Error parsing Jira data for preview', err instanceof Error ? err.message : 'Unknown error');
      }
      
      try {
        const prData = localStorage.getItem('githubPRs');
        if (prData) githubPR = JSON.parse(prData);
      } catch (err) {
        addLog('error', 'Error parsing GitHub PR data for preview', err instanceof Error ? err.message : 'Unknown error');
      }
      
      try {
        concatenatedFiles = localStorage.getItem('concatenatedFiles') || '';
      } catch (err) {
        addLog('error', 'Error loading concatenated files for preview', err instanceof Error ? err.message : 'Unknown error');
      }
      
      try {
        const refData = localStorage.getItem('referenceContents');
        if (refData) referenceContents = JSON.parse(refData);
      } catch (err) {
        addLog('error', 'Error parsing reference contents for preview', err instanceof Error ? err.message : 'Unknown error');
      }

      // Convert referenceContents into the format expected by the LLM
      const validReferenceFiles: ReferenceFileContent[] = Object.entries(referenceContents).map(([fileId, content]) => {
        const referenceFile = REFERENCE_FILES.find(f => f.id === fileId);
        return {
          type: referenceFile?.type || 'unknown',
          name: referenceFile?.name || fileId,
          content: content as string
        };
      });

      // This is just for preview so we can import directly
      const { generateSystemPrompt } = require('../../prompts/systemPrompt');
      
      const promptString = generateSystemPrompt({
        jiraTicket,
        githubPR,
        concatenatedFiles,
        referenceFiles: validReferenceFiles
      });

      setPromptPreview(promptString);
      setShowPromptPreview(true);
      addLog('info', 'Generated prompt preview', `${promptString.length} characters`);
      
      // Scroll to preview
      setTimeout(() => {
        document.getElementById('prompt-preview')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    } catch (err) {
      addLog('error', 'Error generating preview', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error 
        ? `Failed to generate preview: ${err.message}` 
        : 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Submit Code Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Ready to submit your code review request to Gemini
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This will send all collected data (Jira ticket, GitHub PR, selected files, and 
          reference materials) to Gemini's API for processing. The review generation 
          may take 1-2 minutes depending on the amount of code.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/additional-files')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handlePreviewPrompt}
          disabled={loading}
          startIcon={showPromptPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {showPromptPreview ? 'Hide Preview' : 'Preview API Call'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Submit Review'}
        </Button>
      </Box>
      
      {/* Debug logs toggle */}
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="text" 
          size="small"
          onClick={() => setShowDebugLogs(!showDebugLogs)}
          startIcon={showDebugLogs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {showDebugLogs ? 'Hide Debug Logs' : 'Show Debug Logs'}
        </Button>
        
        <Collapse in={showDebugLogs}>
          <Card variant="outlined" sx={{ mt: 2, maxHeight: '300px', overflow: 'auto' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Debug Logs
              </Typography>
              
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No logs yet
                </Typography>
              ) : (
                logs.map((log, index) => (
                  <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < logs.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Chip 
                        label={log.level} 
                        size="small" 
                        color={
                          log.level === 'error' ? 'error' : 
                          log.level === 'warn' ? 'warning' : 
                          'default'
                        }
                        sx={{ mr: 1, fontSize: '0.65rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {log.message}
                    </Typography>
                    {log.details && (
                      <Typography variant="caption" component="pre" sx={{ 
                        mt: 0.5, 
                        p: 1, 
                        background: '#f5f5f5', 
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        overflowX: 'auto'
                      }}>
                        {log.details}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Collapse>
      </Box>

      {/* Display prompt preview */}
      <Collapse in={showPromptPreview}>
        <Box sx={{ mt: 2 }} id="prompt-preview">
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            API Call Preview
          </Typography>
          <Card variant="outlined">
            <CardContent sx={{ p: 0 }}>
              <pre style={{ 
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '500px',
                margin: 0,
                fontSize: '0.75rem',
                backgroundColor: '#f5f5f5'
              }}>
                {promptPreview}
              </pre>
            </CardContent>
          </Card>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ReviewSubmissionStep; 