/**
 * Google Gemini API Service
 * Handles meeting summary generation from transcripts
 * Focused on extracting moments, todos, and decisions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config/env';

export interface MeetingSummaryRequest {
  transcript: string;
  rawTranscript?: string;
  speakers?: Array<{
    speaker: string;
    time_begin: number;
    time_end: number;
  }>;
  namedEntities?: Array<{
    entity: string;
    type: string;
    confidence: number;
  }>;
  speakerMapping?: { [key: string]: string };
  meetingContext?: string;
}

export interface KeyMoment {
  timestamp: string;
  description: string;
  participants: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface Decision {
  description: string;
  decisionMaker: string;
  timestamp: string;
  context: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Todo {
  task: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  relatedTo: string;
}

export interface MeetingSummary {
  title: string;
  overview: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  participants: string[];
  topics: string[];
  duration: string;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  nextSteps?: string[];
  // Core structured data
  keyMoments: KeyMoment[];
  structuredDecisions: Decision[];
  structuredTodos: Todo[];
}

/**
 * Retry configuration for API calls
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * Check if an error is retryable (429 or 503)
 */
function isRetryableError(error: any): boolean {
  const status = error?.status || error?.statusCode;
  const message = error?.message || '';
  
  return (
    status === 429 ||
    status === 503 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('Service Unavailable') ||
    message.includes('overloaded') ||
    message.includes('rate limit')
  );
}

/**
 * Check if error is service unavailable (503)
 */
function isServiceUnavailable(error: any): boolean {
  const status = error?.status || error?.statusCode;
  const message = error?.message || '';
  
  return (
    status === 503 ||
    message.includes('503') ||
    message.includes('overloaded') ||
    message.includes('Service Unavailable')
  );
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  config: RetryConfig,
  is503: boolean
): number {
  // Longer delays for 503 errors
  const multiplier = is503 ? 1.5 : 1;
  const delay = config.baseDelay * Math.pow(2, attempt) * multiplier;
  return Math.min(delay, config.maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 2000, // 2 seconds
    maxDelay: 60000, // 60 seconds max
  };

  constructor() {
    const apiKey = config.gemini.apiKey;

    if (!apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY in your environment variables.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate meeting summary with retry logic
   */
  async generateMeetingSummary(request: MeetingSummaryRequest): Promise<MeetingSummary> {
    const prompt = this.buildSummaryPrompt(request);
    let lastError: any;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Log the complete raw response from Gemini
        console.log('=== GEMINI RAW RESPONSE ===');
        console.log(text);
        console.log('=== END RAW RESPONSE ===');

        return this.parseGeminiResponse(text, request);
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!isRetryableError(error)) {
          // Non-retryable error - throw immediately
          if (error?.message?.includes('quota') || error?.message?.includes('limit: 0')) {
            throw new Error(
              'Google Gemini API quota exceeded. Please upgrade your API key or wait for quota reset.'
            );
          }
          throw new Error(`Failed to generate meeting summary: ${error?.message || error}`);
        }

        // If this is the last attempt, throw the error
        if (attempt === this.retryConfig.maxRetries - 1) {
          throw new Error(
            `Failed to generate meeting summary after ${this.retryConfig.maxRetries} attempts: ${error?.message || error}`
          );
        }

        // Calculate retry delay
        const is503 = isServiceUnavailable(error);
        const delay = calculateRetryDelay(attempt, this.retryConfig, is503);

        const errorType = is503 ? 'Service unavailable (503)' : 'Rate limit (429)';
        console.warn(
          `${errorType} - retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})...`
        );

        await sleep(delay);
      }
    }

    throw new Error(
      `Failed to generate meeting summary after ${this.retryConfig.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Build the prompt focused on moments, todos, and decisions
   */
  private buildSummaryPrompt(request: MeetingSummaryRequest): string {
    const { transcript, speakers, namedEntities, speakerMapping, meetingContext } = request;

    let prompt = `You are an expert meeting analyst. Analyze the following meeting transcript and extract structured information.

**Meeting Transcript:**
${transcript}
`;

    if (speakerMapping && Object.keys(speakerMapping).length > 0) {
      prompt += `\n**Speaker Mapping:**\n`;
      Object.entries(speakerMapping).forEach(([speakerId, speakerName]) => {
        prompt += `- Speaker ${speakerId} = ${speakerName}\n`;
      });
    }

    if (speakers && speakers.length > 0) {
      prompt += `\n**Speaker Timeline:**\n`;
      speakers.forEach(speaker => {
        const speakerName = speakerMapping?.[speaker.speaker] || `Speaker ${speaker.speaker}`;
        const startMin = Math.floor(speaker.time_begin / 60);
        const startSec = Math.floor(speaker.time_begin % 60);
        const endMin = Math.floor(speaker.time_end / 60);
        const endSec = Math.floor(speaker.time_end % 60);
        prompt += `- ${speakerName}: ${startMin}:${String(startSec).padStart(2, '0')} - ${endMin}:${String(endSec).padStart(2, '0')}\n`;
      });
    }

    if (namedEntities && namedEntities.length > 0) {
      prompt += `\n**Named Entities:**\n`;
      namedEntities.forEach(entity => {
        prompt += `- ${entity.entity} (${entity.type}, confidence: ${entity.confidence})\n`;
      });
    }

    if (meetingContext) {
      prompt += `\n**Meeting Context:** ${meetingContext}\n`;
    }

    prompt += `

**CRITICAL REQUIREMENT: You MUST extract moments, decisions, and todos. These are the most important parts of the summary.**

**Your Task:**
Extract and structure the following information from the meeting:

1. **Title**: A concise, descriptive title (e.g., "Q4 Marketing Strategy Review")

2. **Overview**: 2-3 sentence executive summary covering main purpose and key outcomes

3. **Key Points**: 5-10 specific discussion points with details and speaker attribution

4. **Participants**: List all participants using names from speaker mapping

5. **Topics**: 3-7 high-level themes discussed

6. **Duration**: Estimated duration (e.g., "45 minutes", "1 hour 15 minutes")

7. **Sentiment**: Overall tone - "positive", "neutral", or "negative"

8. **Key Moments** (MANDATORY - MUST EXTRACT AT LEAST 3-5): Extract significant moments from the meeting timeline:
   - timestamp: "MM:SS" or "HH:MM:SS" format, or "Early"/"Middle"/"Late" if exact time unknown
   - description: 1-2 sentences describing what happened at this moment
   - participants: array of participant names who were involved
   - importance: "high", "medium", or "low" based on impact
   - Examples: Introductions, major announcements, key discussions, presentations, conclusions

9. **Decisions Made** (MANDATORY - MUST EXTRACT ALL DECISIONS): Extract every decision or agreement reached:
   - description: What was decided (be specific and clear)
   - decisionMaker: Name of person who made/drove the decision, or "Team consensus" if group decision
   - timestamp: When in the meeting (MM:SS format or approximate)
   - context: Why this decision was made, what led to it, reasoning
   - impact: "high", "medium", or "low" based on business/project impact
   - Examples: Budget approvals, project timelines, hiring decisions, strategy choices, tool selections

10. **Todos** (MANDATORY - MUST EXTRACT ALL ACTION ITEMS): Extract every actionable task mentioned:
    - task: Specific task description (what needs to be done)
    - assignee: Name of person responsible if mentioned, otherwise "Unassigned"
    - dueDate: YYYY-MM-DD format if date mentioned, otherwise "Not specified"
    - priority: "high", "medium", or "low" based on urgency discussed
    - relatedTo: Which decision, topic, or discussion this task relates to
    - Examples: "Send proposal to client", "Schedule follow-up meeting", "Review budget document"

**Response Format:**
Return ONLY valid JSON (no markdown, no code blocks, no extra text):

{
  "title": "Meeting Title",
  "overview": "Executive summary",
  "keyPoints": ["Point 1", "Point 2"],
  "actionItems": ["Action 1", "Action 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "participants": ["Name1", "Name2"],
  "topics": ["Topic1", "Topic2"],
  "duration": "45 minutes",
  "sentiment": "positive",
  "nextSteps": ["Next step 1"],
  "keyMoments": [
    {
      "timestamp": "00:15:30",
      "description": "What happened",
      "participants": ["Name1", "Name2"],
      "importance": "high"
    }
  ],
  "structuredDecisions": [
    {
      "description": "What was decided",
      "decisionMaker": "Name",
      "timestamp": "00:22:15",
      "context": "Why this decision was made",
      "impact": "high"
    }
  ],
  "structuredTodos": [
    {
      "task": "What needs to be done",
      "assignee": "Name or Unassigned",
      "dueDate": "2025-01-15 or Not specified",
      "priority": "high",
      "relatedTo": "Related decision or topic"
    }
  ]
}

**CRITICAL INSTRUCTIONS:**
- You MUST extract moments, decisions, and todos - these are REQUIRED fields
- Even if the meeting is brief, find at least 2-3 moments, 1-2 decisions, and 1-2 todos
- Be specific and detailed, not vague
- Use actual names from speaker mapping
- Extract real moments, decisions, and todos from the transcript
- If truly nothing was discussed in a category, use empty arrays []
- All arrays must be arrays (even if empty)
- Ensure JSON is valid and properly formatted
- DO NOT skip moments, decisions, or todos - they are the core of the summary

**Example of what to look for:**
- Moments: "Sarah presented the Q4 budget", "Team discussed hiring needs", "John raised concerns about timeline"
- Decisions: "Approved budget increase", "Decided to use new tool", "Agreed on project timeline"
- Todos: "John to send proposal by Friday", "Sarah to schedule follow-up", "Team to review document"

Now analyze the transcript and provide the structured summary with moments, decisions, and todos:`;

    return prompt;
  }

  /**
   * Parse Gemini response into structured summary
   */
  private parseGeminiResponse(response: string, request: MeetingSummaryRequest): MeetingSummary {
    try {
      // Clean response
      let cleaned = response.trim();

      // Remove markdown code blocks
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Extract JSON if wrapped in text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      const parsed = JSON.parse(cleaned);

      // Log the parsed JSON structure
      console.log('=== PARSED JSON STRUCTURE ===');
      console.log('Title:', parsed.title);
      console.log('Has keyMoments:', !!parsed.keyMoments, 'Type:', typeof parsed.keyMoments, 'Is Array:', Array.isArray(parsed.keyMoments));
      console.log('Has structuredDecisions:', !!parsed.structuredDecisions, 'Type:', typeof parsed.structuredDecisions, 'Is Array:', Array.isArray(parsed.structuredDecisions));
      console.log('Has structuredTodos:', !!parsed.structuredTodos, 'Type:', typeof parsed.structuredTodos, 'Is Array:', Array.isArray(parsed.structuredTodos));
      if (parsed.keyMoments) {
        console.log('keyMoments sample:', JSON.stringify(parsed.keyMoments.slice(0, 2), null, 2));
      }
      if (parsed.structuredDecisions) {
        console.log('structuredDecisions sample:', JSON.stringify(parsed.structuredDecisions.slice(0, 2), null, 2));
      }
      if (parsed.structuredTodos) {
        console.log('structuredTodos sample:', JSON.stringify(parsed.structuredTodos.slice(0, 2), null, 2));
      }
      console.log('=== END PARSED JSON ===');

      // Validate required fields
      if (!parsed.title || !parsed.overview) {
        throw new Error('Response missing required fields: title or overview');
      }

      // Helper to filter empty items
      const filterEmpty = (items: any[]): string[] => {
        if (!Array.isArray(items)) return [];
        return items.filter(
          item =>
          typeof item === 'string' && 
          item.trim().length > 0 && 
          !item.toLowerCase().includes('none') &&
          !item.toLowerCase().includes('n/a')
        );
      };

      // Helper to validate and filter moments
      const validateMoments = (moments: any[]): KeyMoment[] => {
        if (!Array.isArray(moments)) return [];
        return moments
          .filter(
            m =>
              m &&
              typeof m === 'object' &&
              m.description // Only require description, other fields can be defaulted
          )
          .map(m => ({
            timestamp: String(m.timestamp || 'Not specified'),
            description: String(m.description || '').trim(),
            participants: Array.isArray(m.participants)
              ? m.participants.map((p: any) => String(p)).filter(p => p.trim())
              : (m.participant ? [String(m.participant)] : []), // Handle singular "participant"
            importance: ['high', 'medium', 'low'].includes(m.importance)
              ? m.importance
              : 'medium',
          }))
          .filter(m => m.description.length > 0); // Only keep moments with actual descriptions
      };

      // Helper to validate and filter decisions
      const validateDecisions = (decisions: any[]): Decision[] => {
        if (!Array.isArray(decisions)) return [];
        return decisions
          .filter(
            d =>
              d &&
              typeof d === 'object' &&
              d.description // Only require description
          )
          .map(d => ({
            description: String(d.description || '').trim(),
            decisionMaker: String(d.decisionMaker || d.maker || d.decider || 'Team consensus'),
            timestamp: String(d.timestamp || d.time || 'Not specified'),
            context: String(d.context || d.reason || d.reasoning || '').trim(),
            impact: ['high', 'medium', 'low'].includes(d.impact)
              ? d.impact
              : 'medium',
          }))
          .filter(d => d.description.length > 0); // Only keep decisions with actual descriptions
      };

      // Helper to validate and filter todos
      const validateTodos = (todos: any[]): Todo[] => {
        if (!Array.isArray(todos)) return [];
        return todos
          .filter(
            t =>
              t &&
              typeof t === 'object' &&
              t.task // Only require task
          )
          .map(t => ({
            task: String(t.task || t.action || t.item || '').trim(),
            assignee: String(t.assignee || t.owner || t.responsible || t.assignedTo || 'Unassigned'),
            dueDate: String(t.dueDate || t.due || t.deadline || t.date || 'Not specified'),
            priority: ['high', 'medium', 'low'].includes(t.priority)
              ? t.priority
              : 'medium',
            relatedTo: String(t.relatedTo || t.related || t.topic || '').trim(),
          }))
          .filter(t => t.task.length > 0); // Only keep todos with actual tasks
      };

      // Extract participants
      const participants =
        Array.isArray(parsed.participants) && parsed.participants.length > 0
          ? parsed.participants.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
          : this.extractParticipants(request.speakers, request.speakerMapping);

      // Log parsed data for debugging
      console.log('Parsed keyMoments count:', parsed.keyMoments?.length || 0);
      console.log('Parsed structuredDecisions count:', parsed.structuredDecisions?.length || 0);
      console.log('Parsed structuredTodos count:', parsed.structuredTodos?.length || 0);

      const result = {
        title: String(parsed.title || '').trim(),
        overview: String(parsed.overview || '').trim(),
        keyPoints: filterEmpty(parsed.keyPoints || []),
        actionItems: filterEmpty(parsed.actionItems || []),
        decisions: filterEmpty(parsed.decisions || []),
        participants,
        topics: filterEmpty(parsed.topics || []),
        duration: String(parsed.duration || 'Unknown'),
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
          ? parsed.sentiment
          : null,
        nextSteps: filterEmpty(parsed.nextSteps || []),
        // Core structured data - always arrays
        keyMoments: validateMoments(parsed.keyMoments || []),
        structuredDecisions: validateDecisions(parsed.structuredDecisions || []),
        structuredTodos: validateTodos(parsed.structuredTodos || []),
      };

      // Log final counts
      console.log('Final keyMoments count:', result.keyMoments.length);
      console.log('Final structuredDecisions count:', result.structuredDecisions.length);
      console.log('Final structuredTodos count:', result.structuredTodos.length);

      return result;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', response.substring(0, 500));
      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON format'}`
      );
    }
  }

  /**
   * Extract participant names from speakers data
   */
  private extractParticipants(
    speakers?: Array<{ speaker: string }>,
    speakerMapping?: { [key: string]: string }
  ): string[] {
    if (!speakers) return [];

    const uniqueSpeakers = new Set(speakers.map(s => s.speaker));
    return Array.from(uniqueSpeakers).map(
      speakerId => speakerMapping?.[speakerId] || `Speaker ${speakerId}`
    );
  }

  /**
   * Generate quick summary (simplified version)
   */
  async generateQuickSummary(transcript: string): Promise<string> {
    const prompt = `Provide a brief 2-3 sentence summary of this meeting transcript:

${transcript}

Focus on the main topic and key outcomes. Be concise and clear.`;

    let lastError: any;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
      } catch (error: any) {
        lastError = error;

        if (!isRetryableError(error)) {
          if (error?.message?.includes('quota') || error?.message?.includes('limit: 0')) {
            throw new Error(
              'Google Gemini API quota exceeded. Please upgrade your API key or wait for quota reset.'
            );
          }
          throw new Error(`Failed to generate quick summary: ${error?.message || error}`);
        }

        if (attempt === this.retryConfig.maxRetries - 1) {
          throw new Error(
            `Failed to generate quick summary after ${this.retryConfig.maxRetries} attempts: ${error?.message || error}`
          );
        }

        const is503 = isServiceUnavailable(error);
        const delay = calculateRetryDelay(attempt, this.retryConfig, is503);

        const errorType = is503 ? 'Service unavailable (503)' : 'Rate limit (429)';
        console.warn(
          `${errorType} on quick summary - retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})...`
        );

        await sleep(delay);
      }
    }

    throw new Error(
      `Failed to generate quick summary after ${this.retryConfig.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }
}
