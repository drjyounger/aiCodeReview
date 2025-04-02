import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import { getTicketDetails } from '../../services/JiraService';
import { JiraTicket } from '../../types';

const JiraTicketStep: React.FC = () => {
  const navigate = useNavigate();
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<JiraTicket[]>([]);

  const handleFetchTickets = async () => {
    setError(null);
    setLoading(true);

    // Split input by commas and trim whitespace
    const ticketNumbers = ticketInput
      .split(',')
      .map(ticket => ticket.trim())
      .filter(ticket => ticket.length > 0);

    if (ticketNumbers.length === 0) {
      setError('Please enter at least one ticket number');
      setLoading(false);
      return;
    }

    console.log('[client] [Step1:JiraTicket] Attempting to fetch Jira tickets:', ticketNumbers);

    try {
      const response = await getTicketDetails(ticketNumbers);
      
      if (response.success && response.data) {
        console.log('[client] [Step1:JiraTicket] Successfully retrieved Jira ticket data:', response.data);
        setTickets(response.data);
      } else {
        setError(response.error || 'Failed to fetch ticket details');
      }
    } catch (err) {
      console.error('[client] [Step1:JiraTicket] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (tickets.length > 0) {
      localStorage.setItem('jiraTickets', JSON.stringify(tickets));
      console.log('[client] [Step1:JiraTicket] Stored tickets in localStorage. Navigating to GitHub PR step.');
      navigate('/github-pr');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 1: Enter Jira Tickets
      </Typography>
      
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Jira Ticket Numbers"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="e.g., PROJ-123, PROJ-124, PROJ-125"
            disabled={loading}
            error={!!error}
            helperText={error || 'Enter multiple ticket numbers separated by commas'}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleFetchTickets}
            disabled={!ticketInput.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Fetch Tickets'}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={tickets.length === 0 || loading}
          >
            Next
          </Button>
        </Box>

        {tickets.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Fetched Jira Tickets:
            </Typography>
            <Stack spacing={2}>
              {tickets.map((ticket) => (
                <Paper key={ticket.key} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={ticket.key} 
                      color="primary" 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="subtitle1" fontWeight="bold">
                      {ticket.summary}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}
                  >
                    {ticket.description}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default JiraTicketStep; 