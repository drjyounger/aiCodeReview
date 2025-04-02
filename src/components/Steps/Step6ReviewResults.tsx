import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Snackbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';

interface ReviewResult {
  review: string;
  suggestions: string[];
  score: number;
}

interface Sections {
  [key: string]: string;
  summary: string;
  criticalIssues: string;
  recommendations: string;
  highlights: string;
  breakdown: string;
}

const Step6ReviewResults: React.FC = () => {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    try {
      const storedReview = localStorage.getItem('reviewResult');
      if (!storedReview) {
        throw new Error('No review data found');
      }
      setReviewData(JSON.parse(storedReview));
    } catch (err) {
      setError('Failed to load review results');
      console.error(err);
    }
  }, []);

  // Parse review sections from the text
  const parseSections = (review: string) => {
    const sections: Sections = {
      summary: '',
      criticalIssues: '',
      recommendations: '',
      highlights: '',
      breakdown: ''
    };

    let currentSection = '';
    const lines = review.split('\n');

    for (const line of lines) {
      if (line.includes('1. SUMMARY')) {
        currentSection = 'summary';
      } else if (line.includes('2. CRITICAL ISSUES')) {
        currentSection = 'criticalIssues';
      } else if (line.includes('3. RECOMMENDATIONS')) {
        currentSection = 'recommendations';
      } else if (line.includes('4. POSITIVE HIGHLIGHTS')) {
        currentSection = 'highlights';
      } else if (line.includes('5. DETAILED BREAKDOWN')) {
        currentSection = 'breakdown';
      } else if (currentSection) {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  };

  const defaultSections: Sections = {
    summary: '',
    criticalIssues: '',
    recommendations: '',
    highlights: '',
    breakdown: ''
  };

  const sections: Sections = reviewData ? parseSections(reviewData.review) : defaultSections;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reviewData?.review || '');
      setSnackbar({
        open: true,
        message: 'Review copied to clipboard!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to copy to clipboard',
        severity: 'error'
      });
    }
  };

  const handleDownload = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `code-review-${timestamp}.md`;
      
      // Create the file content
      const content = reviewData?.review || '';
      
      // Create a blob and download
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbar({
        open: true,
        message: 'Review downloaded successfully!',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to download review',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/submit-review')}>
          Back to Review Submission
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Code Review Results
        </Typography>
        <Box>
          <Tooltip title="Copy to Clipboard">
            <IconButton onClick={handleCopyToClipboard} color="primary">
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Review">
            <IconButton onClick={handleDownload} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {sections && (
        <Box sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.summary}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="error">Critical Issues</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.criticalIssues}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">Recommendations</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.recommendations}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="success.main">Positive Highlights</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.highlights}
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Detailed Breakdown</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {sections.breakdown}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/submit-review')}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            localStorage.clear(); // Clear wizard data
            navigate('/jira-ticket');
          }}
        >
          Start New Review
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      />
    </Paper>
  );
};

export default Step6ReviewResults;
