import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
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
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = error?.message || '';
  
  return (
    status === 429 ||
    status === 503 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('rate_limit_exceeded') ||
    message.includes('overloaded') ||
    message.includes('server_error')
  );
}

/**
 * Check if error is service unavailable (503)
 */
function isServiceUnavailable(error: any): boolean {
  const status = error?.status || error?.statusCode || error?.response?.status;
  const message = error?.message || '';
  
  return (
    status === 503 ||
    message.includes('503') ||
    message.includes('overloaded') ||
    message.includes('server_error')
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

export class OpenAISummaryService {
  private model: ReturnType<typeof openai>;
  private modelName: string;
  private retryConfig: RetryConfig = {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
  };

  constructor() {
    const apiKey = config.openai.apiKey;

    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY in your environment variables.');
    }

    this.modelName = process.env.OPENAI_SUMMARY_MODEL || 'gpt-5-mini';
    this.model = openai(this.modelName);
  }

  /**
   * Generate meeting summary with retry logic
   */
  async generateMeetingSummary(request: MeetingSummaryRequest): Promise<MeetingSummary> {
    const prompt = this.buildSummaryPrompt(request);
    let lastError: any;

    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const { text } = await generateText({
          model: this.model,
          system: 'You are an expert meeting analyst. Your task is to extract comprehensive information from meeting transcripts, with special focus on detailed key moments, decisions made, and action items (todos). Provide thorough and detailed responses. Be comprehensive and include as many relevant points as possible.',
          prompt: prompt,
          temperature: 0.3, // Lower temperature for more consistent structured output
        });

        if (!text) {
          throw new Error('Empty response from OpenAI');
        }

        // Log the complete raw response
        console.log('=== OPENAI RAW RESPONSE ===');
        console.log(text);
        console.log('=== END RAW RESPONSE ===');

        return this.parseOpenAIResponse(text, request);
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!isRetryableError(error)) {
          if (error?.message?.includes('quota') || error?.message?.includes('insufficient_quota')) {
            throw new Error(
              'OpenAI API quota exceeded. Please check your API key limits or upgrade your plan.'
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
   * Build detailed prompt focused on moments, todos, and decisions
   */
  private buildSummaryPrompt(request: MeetingSummaryRequest): string {
    const { transcript, speakers, namedEntities, speakerMapping, meetingContext } = request;

    let prompt = `You are an expert meeting-summarization assistant. Given any transcript, extract the content into three sections: Moments of Meeting, Action Points, and To-Dos.

Moments of Meeting: Provide detailed, comprehensive bullet points that capture ALL key discussion points from the transcript. Be thorough and include as many relevant moments as possible. Each moment should be detailed enough to understand the context and significance. Include discussions about topics, ideas shared, questions raised, concerns mentioned, and any notable exchanges. Aim for 15-30+ detailed moments depending on the transcript length.

Action Points: List all items that require attention, decisions, or follow-ups based on the transcript. These should highlight things the participants need to think about or resolve. Include all decision points, concerns raised, and items that need further consideration.

To-Dos: Convert the transcript into a list of actionable, concrete tasks. Every task must start with a verb and be practical, specific, and easy to execute. Include all tasks mentioned or implied in the conversation.

Rules:
- Do not copy exact sentences unless necessary.
- Rewrite into clean, simple business English.
- Maintain logical flow even if the transcript is messy.
- Break big ideas into smaller, clear tasks.
- Infer meaning where needed but do not invent new ideas.
- Be comprehensive - extract as many relevant points as possible.
- For Moments of Meeting, provide detailed descriptions that give context and meaning.

Output structure example:

Moments of Meeting:
• [Detailed description of first key moment with context]
• [Detailed description of second key moment with context]
• [Continue with all relevant moments...]

Action Points:
• [First action point]
• [Second action point]
• [Continue with all action points...]

To-Dos:
• [First actionable task]
• [Second actionable task]
• [Continue with all tasks...]

**MEETING TRANSCRIPT:**
${transcript}
`;

    if (speakerMapping && Object.keys(speakerMapping).length > 0) {
      prompt += `\n**SPEAKER MAPPING:**\n`;
      Object.entries(speakerMapping).forEach(([speakerId, speakerName]) => {
        prompt += `- Speaker ${speakerId} = ${speakerName}\n`;
      });
    }

    if (speakers && speakers.length > 0) {
      prompt += `\n**SPEAKER TIMELINE:**\n`;
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
      prompt += `\n**NAMED ENTITIES DETECTED:**\n`;
      namedEntities.forEach(entity => {
        prompt += `- ${entity.entity} (${entity.type}, confidence: ${entity.confidence})\n`;
      });
    }

    if (meetingContext) {
      prompt += `\n**MEETING CONTEXT:** ${meetingContext}\n`;
    }

    prompt += `\nNow process the following transcript:`;

    return prompt;
  }

  /**
   * Parse OpenAI response into structured summary
   * Handles both JSON and plain text formats
   */
  private parseOpenAIResponse(response: string, request: MeetingSummaryRequest): MeetingSummary {
    try {
      // Clean response
      let cleaned = response.trim();

      // Remove markdown code blocks if present
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to parse as JSON first
      let parsed: any;
      try {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(cleaned);
        }
      } catch (jsonError) {
        // If JSON parsing fails, parse as plain text
        parsed = this.parsePlainTextResponse(cleaned);
      }

      // Helper to convert string arrays to structured format
      const convertStringArrayToMoments = (arr: any[]): KeyMoment[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map((desc, idx) => ({
            timestamp: this.estimateTimestamp(idx, arr.length),
            description: desc.trim(),
            participants: [],
            importance: 'medium' as const,
          }));
      };

      const convertStringArrayToDecisions = (arr: any[]): Decision[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map((desc) => ({
            description: desc.trim(),
            decisionMaker: 'Team consensus',
            timestamp: 'Not specified',
            context: '',
            impact: 'medium' as const,
          }));
      };

      const convertStringArrayToTodos = (arr: any[]): Todo[] => {
        if (!Array.isArray(arr)) return [];
        return arr
          .filter(item => typeof item === 'string' && item.trim().length > 0)
          .map((task) => ({
            task: task.trim(),
            assignee: 'Unassigned',
            dueDate: 'Not specified',
            priority: 'medium' as const,
            relatedTo: '',
          }));
      };

      // Get raw values (could be arrays of strings or structured objects)
      const rawKeyMoments = parsed.keyMoments || parsed['Moments of Meeting'] || parsed.moments || [];
      const rawDecisions = parsed.structuredDecisions || parsed['Action Points'] || parsed.actionPoints || [];
      const rawTodos = parsed.structuredTodos || parsed['To-Dos'] || parsed.todos || parsed.actionItems || [];

      // Convert string arrays to structured format if needed
      const keyMoments = Array.isArray(rawKeyMoments) && rawKeyMoments.length > 0
        ? (typeof rawKeyMoments[0] === 'string' 
            ? convertStringArrayToMoments(rawKeyMoments)
            : rawKeyMoments)
        : [];
      
      const structuredDecisions = Array.isArray(rawDecisions) && rawDecisions.length > 0
        ? (typeof rawDecisions[0] === 'string'
            ? convertStringArrayToDecisions(rawDecisions)
            : rawDecisions)
        : [];
      
      const structuredTodos = Array.isArray(rawTodos) && rawTodos.length > 0
        ? (typeof rawTodos[0] === 'string'
            ? convertStringArrayToTodos(rawTodos)
            : rawTodos)
        : [];

      // Handle alternative field names and normalize
      const normalizedParsed = {
        ...parsed,
        // Use converted structured data
        keyMoments,
        structuredDecisions,
        structuredTodos,
        // Ensure title and overview exist
        title: parsed.title || parsed.Title || 'Meeting Summary',
        overview: parsed.overview || parsed.Overview || parsed.summary || this.generateOverviewFromTranscript(request.transcript),
      };

      // Log the parsed structure
      console.log('=== PARSED STRUCTURE ===');
      console.log('Title:', normalizedParsed.title);
      console.log('Overview:', normalizedParsed.overview?.substring(0, 100));
      console.log('Has keyMoments:', !!normalizedParsed.keyMoments, 'Type:', typeof normalizedParsed.keyMoments, 'Is Array:', Array.isArray(normalizedParsed.keyMoments));
      console.log('Has structuredDecisions:', !!normalizedParsed.structuredDecisions, 'Type:', typeof normalizedParsed.structuredDecisions, 'Is Array:', Array.isArray(normalizedParsed.structuredDecisions));
      console.log('Has structuredTodos:', !!normalizedParsed.structuredTodos, 'Type:', typeof normalizedParsed.structuredTodos, 'Is Array:', Array.isArray(normalizedParsed.structuredTodos));
      if (normalizedParsed.keyMoments && Array.isArray(normalizedParsed.keyMoments)) {
        console.log('keyMoments count:', normalizedParsed.keyMoments.length);
        if (normalizedParsed.keyMoments.length > 0) {
          console.log('keyMoments sample:', JSON.stringify(normalizedParsed.keyMoments.slice(0, 2), null, 2));
        }
      }
      if (normalizedParsed.structuredDecisions && Array.isArray(normalizedParsed.structuredDecisions)) {
        console.log('structuredDecisions count:', normalizedParsed.structuredDecisions.length);
        if (normalizedParsed.structuredDecisions.length > 0) {
          console.log('structuredDecisions sample:', JSON.stringify(normalizedParsed.structuredDecisions.slice(0, 2), null, 2));
        }
      }
      if (normalizedParsed.structuredTodos && Array.isArray(normalizedParsed.structuredTodos)) {
        console.log('structuredTodos count:', normalizedParsed.structuredTodos.length);
        if (normalizedParsed.structuredTodos.length > 0) {
          console.log('structuredTodos sample:', JSON.stringify(normalizedParsed.structuredTodos.slice(0, 2), null, 2));
        }
      }
      console.log('=== END PARSED STRUCTURE ===');

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
          .filter(m => m && typeof m === 'object' && m.description)
          .map(m => ({
            timestamp: String(m.timestamp || 'Not specified'),
            description: String(m.description || '').trim(),
            participants: Array.isArray(m.participants)
              ? m.participants.map((p: any) => String(p)).filter((p: string) => p.trim())
              : (m.participant ? [String(m.participant)] : []),
            importance: ['high', 'medium', 'low'].includes(m.importance)
              ? m.importance
              : 'medium',
          }))
          .filter(m => m.description.length > 0);
      };

      // Helper to validate and filter decisions
      const validateDecisions = (decisions: any[]): Decision[] => {
        if (!Array.isArray(decisions)) return [];
        return decisions
          .filter(d => d && typeof d === 'object' && d.description)
          .map(d => ({
            description: String(d.description || '').trim(),
            decisionMaker: String(d.decisionMaker || d.maker || d.decider || 'Team consensus'),
            timestamp: String(d.timestamp || d.time || 'Not specified'),
            context: String(d.context || d.reason || d.reasoning || '').trim(),
            impact: ['high', 'medium', 'low'].includes(d.impact) ? d.impact : 'medium',
          }))
          .filter(d => d.description.length > 0);
      };

      // Helper to validate and filter todos
      const validateTodos = (todos: any[]): Todo[] => {
        if (!Array.isArray(todos)) return [];
        return todos
          .filter(t => t && typeof t === 'object' && t.task)
          .map(t => ({
            task: String(t.task || t.action || t.item || '').trim(),
            assignee: String(t.assignee || t.owner || t.responsible || t.assignedTo || 'Unassigned'),
            dueDate: String(t.dueDate || t.due || t.deadline || t.date || 'Not specified'),
            priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
            relatedTo: String(t.relatedTo || t.related || t.topic || '').trim(),
          }))
          .filter(t => t.task.length > 0);
      };

      // Extract participants
      const participants =
        Array.isArray(normalizedParsed.participants) && normalizedParsed.participants.length > 0
          ? normalizedParsed.participants.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
          : this.extractParticipants(request.speakers, request.speakerMapping);

      const result = {
        title: String(normalizedParsed.title || '').trim(),
        overview: String(normalizedParsed.overview || '').trim(),
        keyPoints: filterEmpty(normalizedParsed.keyPoints || []),
        actionItems: filterEmpty(normalizedParsed.actionItems || []),
        decisions: filterEmpty(normalizedParsed.decisions || []),
        participants,
        topics: filterEmpty(normalizedParsed.topics || []),
        duration: String(normalizedParsed.duration || this.estimateDuration(request.transcript)),
        sentiment: ['positive', 'neutral', 'negative'].includes(normalizedParsed.sentiment)
          ? normalizedParsed.sentiment
          : null,
        nextSteps: filterEmpty(normalizedParsed.nextSteps || []),
        // Core structured data - always arrays
        keyMoments: validateMoments(normalizedParsed.keyMoments || []),
        structuredDecisions: validateDecisions(normalizedParsed.structuredDecisions || []),
        structuredTodos: validateTodos(normalizedParsed.structuredTodos || []),
      };

      // Log final counts
      console.log('Final keyMoments count:', result.keyMoments.length);
      console.log('Final structuredDecisions count:', result.structuredDecisions.length);
      console.log('Final structuredTodos count:', result.structuredTodos.length);

      return result;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw response:', response.substring(0, 500));
      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON format'}`
      );
    }
  }

  /**
   * Parse plain text response into structured format
   */
  private parsePlainTextResponse(text: string): any {
    const result: any = {
      title: 'Meeting Summary',
      overview: '',
      keyMoments: [],
      structuredDecisions: [],
      structuredTodos: [],
      keyPoints: [],
      actionItems: [],
      decisions: [],
      participants: [],
      topics: [],
      duration: 'Unknown',
      sentiment: null,
      nextSteps: [],
    };

    // Split by sections
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentSection = '';
    const moments: string[] = [];
    const actionPoints: string[] = [];
    const todos: string[] = [];

    for (const line of lines) {
      // Detect section headers - handle markdown formatting (**text:**) and plain text
      const normalizedLine = line.replace(/\*\*/g, '').replace(/:/g, '').trim();
      if (normalizedLine.match(/^Moments of Meeting/i) || normalizedLine.match(/^Key Moments/i)) {
        currentSection = 'moments';
        continue;
      } else if (normalizedLine.match(/^Action Points/i) || normalizedLine.match(/^Decisions/i)) {
        currentSection = 'actionPoints';
        continue;
      } else if (normalizedLine.match(/^To-Dos/i) || normalizedLine.match(/^Todos/i) || normalizedLine.match(/^Action Items/i)) {
        currentSection = 'todos';
        continue;
      }

      // Extract bullet points - handle various formats
      let content = '';
      if (line.startsWith('•')) {
        content = line.replace(/^•\s*/, '').trim();
      } else if (line.startsWith('-')) {
        content = line.replace(/^-\s*/, '').trim();
      } else if (line.startsWith('*') && !line.startsWith('**')) {
        content = line.replace(/^\*\s*/, '').trim();
      } else if (/^\d+\./.test(line)) {
        content = line.replace(/^\d+\.\s*/, '').trim();
      }
      
      if (content && currentSection) {
        if (currentSection === 'moments') {
          moments.push(content);
        } else if (currentSection === 'actionPoints') {
          actionPoints.push(content);
        } else if (currentSection === 'todos') {
          todos.push(content);
        }
      }
    }

    // Convert moments to structured format
    result.keyMoments = moments.map((desc, idx) => ({
      timestamp: this.estimateTimestamp(idx, moments.length),
      description: desc,
      participants: [],
      importance: 'medium' as const,
    }));

    // Convert action points to structured decisions
    result.structuredDecisions = actionPoints.map((desc) => ({
      description: desc,
      decisionMaker: 'Team consensus',
      timestamp: 'Not specified',
      context: '',
      impact: 'medium' as const,
    }));

    // Convert todos to structured format
    result.structuredTodos = todos.map((task) => ({
      task: task,
      assignee: 'Unassigned',
      dueDate: 'Not specified',
      priority: 'medium' as const,
      relatedTo: '',
    }));

    // Also populate simple arrays for backward compatibility
    result.keyPoints = moments;
    result.actionItems = todos;
    result.decisions = actionPoints;

    // Generate overview from moments
    if (moments.length > 0) {
      result.overview = `This meeting covered ${moments.length} key discussion points. ${moments.slice(0, 2).join(' ')}`;
    } else {
      result.overview = 'Meeting summary generated from transcript analysis.';
    }

    return result;
  }

  /**
   * Estimate timestamp based on position in array
   */
  private estimateTimestamp(index: number, total: number): string {
    if (total === 0) return 'Not specified';
    const position = index / total;
    if (position < 0.33) return 'Early';
    if (position < 0.66) return 'Middle';
    return 'Late';
  }

  /**
   * Estimate duration from transcript length
   */
  private estimateDuration(transcript: string): string {
    // Rough estimate: ~150 words per minute, ~5 words per second
    const wordCount = transcript.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 150);
    if (minutes < 1) return '< 1 minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }

  /**
   * Generate overview from transcript
   */
  private generateOverviewFromTranscript(transcript: string): string {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length === 0) {
      return 'Meeting summary generated from transcript analysis.';
    }
    const firstFew = sentences.slice(0, 2).join('. ').trim();
    return `${firstFew}${firstFew.endsWith('.') ? '' : '.'}`;
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
        const { text } = await generateText({
          model: this.model,
          prompt: prompt,
          temperature: 0.7,
        });

        if (!text) {
          throw new Error('Empty response from OpenAI');
        }

        return text.trim();
      } catch (error: any) {
        lastError = error;

        if (!isRetryableError(error)) {
          if (error?.message?.includes('quota') || error?.message?.includes('insufficient_quota')) {
            throw new Error(
              'OpenAI API quota exceeded. Please check your API key limits or upgrade your plan.'
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
