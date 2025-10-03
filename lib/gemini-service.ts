/**
 * Google Gemini API Service
 * Handles meeting summary generation from transcripts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@/config/env';

export interface MeetingSummaryRequest {
  transcript: string;
  rawTranscript?: string; // Original transcript without speaker labels
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
  speakerMapping?: { [key: string]: string }; // Maps speaker IDs to names
  meetingContext?: string;
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
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = config.gemini.apiKey;

    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Generate a comprehensive meeting summary from transcript
   */
  async generateMeetingSummary(request: MeetingSummaryRequest): Promise<MeetingSummary> {
    try {
      const prompt = this.buildSummaryPrompt(request);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the structured response
      return this.parseGeminiResponse(text, request);
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      throw new Error(`Failed to generate meeting summary: ${error}`);
    }
  }

  /**
   * Build the prompt for Gemini to generate meeting summary
   */
  private buildSummaryPrompt(request: MeetingSummaryRequest): string {
    const { transcript, rawTranscript, speakers, namedEntities, speakerMapping, meetingContext } = request;

    let prompt = `
You are an expert meeting analyst. Please analyze the following meeting transcript and provide a comprehensive summary in JSON format.

**Speaker-Labeled Meeting Transcript:**
${transcript}
`;

    if (speakerMapping && Object.keys(speakerMapping).length > 0) {
      prompt += `\n**Speaker Mapping:**\n`;
      Object.entries(speakerMapping).forEach(([speakerId, speakerName]) => {
        prompt += `- Speaker ${speakerId} = ${speakerName}\n`;
      });
    }

    if (speakers && speakers.length > 0) {
      prompt += `\n**Speakers Information:**\n`;
      speakers.forEach(speaker => {
        const speakerName = speakerMapping?.[speaker.speaker] || `Speaker ${speaker.speaker}`;
        prompt += `- ${speakerName}: ${speaker.time_begin}s - ${speaker.time_end}s\n`;
      });
    }

    if (namedEntities && namedEntities.length > 0) {
      prompt += `\n**Named Entities Detected:**\n`;
      namedEntities.forEach(entity => {
        prompt += `- ${entity.entity} (${entity.type}) - Confidence: ${entity.confidence}\n`;
      });
    }

    if (meetingContext) {
      prompt += `\n**Meeting Context:** ${meetingContext}\n`;
    }

    prompt += `
Please analyze this meeting transcript and provide a comprehensive, structured summary in JSON format.

**IMPORTANT INSTRUCTIONS:**

1. **Title**: Create a concise, descriptive title that captures the meeting's main purpose (e.g., "Q4 Marketing Strategy Review", "Product Roadmap Planning Session")

2. **Overview**: Write a 2-3 sentence executive summary covering:
   - Main purpose of the meeting
   - Key outcomes or conclusions
   - Overall context

3. **Key Points/Highlights**: Extract specific discussion points that were actually talked about:
   - Each point should be ONE distinct topic or statement
   - Include WHO said WHAT when relevant (use actual names from speaker mapping)
   - Be specific, not general or vague
   - Extract concrete details, numbers, dates, or references mentioned
   - GOOD: "Sarah proposed increasing the marketing budget by 15% for Q4"
   - BAD: "Budget discussions occurred"

4. **Action Items/To-Dos**: Extract ACTIONABLE tasks with these details:
   - What needs to be done (specific task)
   - Who is responsible (assignee)
   - When it's due (deadline if mentioned)
   - Format: "Task description [Owner: Name] [Due: Date]" or just "Task description" if details not mentioned
   - Only include items that are clearly actionable, not general discussions
   - GOOD: "John to send revised proposal to client by Friday"
   - BAD: "Follow up on proposal"

5. **Decisions Made**: Document specific decisions or agreements:
   - Only include items where a clear decision was reached
   - Include what was decided and why (if context given)
   - GOOD: "Approved budget increase to $50k for new campaign based on Q3 performance"
   - BAD: "Budget was discussed"

6. **Topics Discussed**: High-level themes or subjects covered (3-7 topics max)

7. **Participants**: List all speakers using actual names from speaker mapping

8. **Sentiment**: Analyze the overall tone:
   - positive: Productive, enthusiastic, collaborative, successful outcomes
   - neutral: Informational, standard business discussion
   - negative: Conflicts, concerns, problems without clear solutions

9. **Next Steps**: Future actions, follow-up meetings, or planned activities

**JSON Response Format:**
{
  "title": "Clear, descriptive meeting title",
  "overview": "2-3 sentence executive summary of purpose and outcomes",
  "keyPoints": [
    "Specific discussion point with details and speaker attribution when relevant",
    "Another distinct point - each should be standalone and specific"
  ],
  "actionItems": [
    "Specific task with owner and deadline if mentioned [Owner: Name] [Due: Date]",
    "Another actionable task with clear responsibility"
  ],
  "decisions": [
    "Specific decision made with context and reasoning if available",
    "Another decision reached during the meeting"
  ],
  "participants": ["Actual participant names from speaker mapping"],
  "topics": ["Main theme 1", "Main theme 2", "Main theme 3"],
  "duration": "Estimated duration (e.g., '45 minutes', '1 hour')",
  "sentiment": "positive | neutral | negative",
  "nextSteps": [
    "Planned follow-up action or future meeting",
    "Another next step or future activity"
  ]
}

**Quality Guidelines:**
- Be specific and detailed, not vague or general
- Use names from the speaker mapping when referencing who said what
- Extract actual quotes or paraphrases of important statements
- Ensure action items are truly actionable with clear owners when mentioned
- Only list decisions where actual agreement or conclusion was reached
- Each key point should be a complete, standalone statement
- Use professional, clear language
- Focus on substance over filler words
- If something wasn't discussed, leave that array empty rather than making assumptions

**Response Requirements:**
- Respond ONLY with valid JSON
- No markdown code blocks, no extra text
- Ensure all arrays have at least one meaningful item or are empty []
- All strings must be properly escaped for JSON
- Double-check JSON validity before responding

Now analyze the transcript and provide the structured summary:
`;

    return prompt;
  }

  /**
   * Parse Gemini's response into structured summary
   */
  private parseGeminiResponse(response: string, request: MeetingSummaryRequest): MeetingSummary {
    try {
      // Clean up the response to extract JSON
      let cleanedResponse = response.trim();

      // Remove any markdown formatting
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to find JSON if there's extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanedResponse);

      // Validate required fields - throw error if missing
      if (!parsed.title || !parsed.overview) {
        throw new Error('AI response missing required fields: title or overview');
      }

      if (!Array.isArray(parsed.keyPoints) || !Array.isArray(parsed.actionItems)) {
        throw new Error('AI response has invalid format for keyPoints or actionItems');
      }

      // Filter out empty or placeholder items
      const filterEmptyItems = (items: any[]): string[] => {
        if (!Array.isArray(items)) return [];
        return items.filter(item => 
          typeof item === 'string' && 
          item.trim().length > 0 && 
          !item.toLowerCase().includes('none') &&
          !item.toLowerCase().includes('n/a')
        );
      };

      return {
        title: parsed.title.trim(),
        overview: parsed.overview.trim(),
        keyPoints: filterEmptyItems(parsed.keyPoints),
        actionItems: filterEmptyItems(parsed.actionItems),
        decisions: filterEmptyItems(parsed.decisions || []),
        participants: Array.isArray(parsed.participants) && parsed.participants.length > 0 
          ? parsed.participants.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
          : this.extractParticipants(request.speakers, request.speakerMapping),
        topics: filterEmptyItems(parsed.topics || []),
        duration: parsed.duration || 'Unknown',
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : null,
        nextSteps: filterEmptyItems(parsed.nextSteps || []),
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', response);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  }

  /**
   * Extract participant names from speakers data
   */
  private extractParticipants(speakers?: Array<{ speaker: string }>, speakerMapping?: { [key: string]: string }): string[] {
    if (!speakers) return [];

    const uniqueSpeakers = new Set(speakers.map(s => s.speaker));
    return Array.from(uniqueSpeakers).map(speakerId =>
      speakerMapping?.[speakerId] || `Speaker ${speakerId}`
    );
  }


  /**
   * Generate a quick summary for display purposes
   */
  async generateQuickSummary(transcript: string): Promise<string> {
    try {
      const prompt = `
Provide a brief 2-3 sentence summary of this meeting transcript:

${transcript}

Focus on the main topic and key outcomes. Be concise and clear.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating quick summary:', error);
      throw new Error(`Failed to generate quick summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
