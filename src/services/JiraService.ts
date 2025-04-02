import axios from 'axios';
import { JiraTicket, ApiResponse } from '../types';
import { addLog, formatError, getErrorDetails } from '../utils/errorHandling';

const API_BASE_URL = 'http://localhost:3001/api';

export const getTicketDetails = async (ticketNumbers: string[]): Promise<ApiResponse<JiraTicket[]>> => {
  try {
    addLog('info', 'Jira', `Fetching ${ticketNumbers.length} Jira tickets`, ticketNumbers.join(', '));
    
    // Fetch all tickets in parallel
    const ticketPromises = ticketNumbers.map(async (ticketNumber) => {
      try {
        addLog('debug', 'Jira', `Fetching ticket ${ticketNumber}`);
        const response = await axios.get(`${API_BASE_URL}/jira/ticket/${ticketNumber}`);
        const data = response.data;

        // Simplified ticket with only key, summary, and description
        const ticket = {
          key: data.key,
          summary: data.fields.summary,
          description: data.fields.description || '',
        };
        
        addLog('info', 'Jira', `Successfully fetched ticket ${ticketNumber}`, `Summary: ${ticket.summary.substring(0, 50)}...`);
        return ticket;
      } catch (err) {
        // Log the individual ticket error but don't fail the whole operation
        addLog('error', 'Jira', `Failed to fetch ticket ${ticketNumber}`, undefined, err instanceof Error ? err : new Error(String(err)));
        
        // Return a placeholder ticket with error information
        return {
          key: ticketNumber,
          summary: `Error fetching ticket ${ticketNumber}`,
          description: `Failed to fetch this ticket: ${formatError(err)}`,
        };
      }
    });

    const tickets = await Promise.all(ticketPromises);
    
    // Check if any tickets were successfully fetched
    const validTickets = tickets.filter(t => !t.summary.startsWith('Error fetching ticket'));
    
    if (validTickets.length === 0 && tickets.length > 0) {
      // All tickets failed
      throw new Error(`Failed to fetch any valid tickets. Check your Jira credentials and ticket numbers.`);
    }
    
    addLog('info', 'Jira', `Completed fetching ${validTickets.length} valid tickets out of ${ticketNumbers.length} requested`);

    return {
      success: true,
      data: tickets,
    };
  } catch (error: any) {
    const errorMessage = formatError(error);
    const details = getErrorDetails(error);
    
    addLog('error', 'Jira', 'Error fetching Jira tickets', details, error instanceof Error ? error : undefined);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
};
