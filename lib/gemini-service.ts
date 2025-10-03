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
Please provide a comprehensive analysis in the following JSON structure:

{
  "title": "A concise, descriptive title for the meeting",
  "overview": "A 2-3 sentence summary of the meeting's main purpose and outcomes",
  "keyPoints": ["Array of specific, individual discussion points - each point should be a distinct statement, not a combination of multiple topics"],
  "actionItems": ["Array of specific tasks, assignments, or follow-ups mentioned"],
  "decisions": ["Array of decisions made during the meeting"],
  "participants": ["Array of identified participants/speakers using their actual names when available"],
  "topics": ["Array of main topics/themes discussed"],
  "duration": "Estimated meeting duration based on transcript",
  "sentiment": "Overall meeting sentiment: positive, neutral, or negative",
  "nextSteps": ["Array of planned next steps or future actions"]
}

Guidelines:
- Use the speaker-labeled transcript with timestamps and speaker names for better context
- When referencing speakers in summaries, use their actual names from the speaker mapping when available
- For keyPoints: Extract each distinct discussion point as a separate item. DO NOT combine multiple unrelated topics into one point
  * GOOD: "John mentioned wanting to buy a new iPhone", "Sarah discussed her sleep schedule issues", "Mike talked about playing badminton"
  * BAD: "Individual statements regarding personal interests and desires (e.g., iPhone purchase, sleep, badminton)"
- Each keyPoint should be specific and standalone, mentioning who said what when relevant
- Be concise but comprehensive
- Focus on actionable items and key decisions
- Extract concrete next steps and deadlines if mentioned
- Pay attention to who said what by using the speaker labels
- Assess the overall tone and productivity of the meeting
- Use clear, professional language
- Ensure all JSON fields are properly formatted
- Avoid vague generalizations - be specific about what was actually discussed

Respond ONLY with valid JSON, no additional text or formatting.
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

      const parsed = JSON.parse(cleanedResponse);

      // Validate required fields - throw error if missing
      if (!parsed.title || !parsed.overview) {
        throw new Error('AI response missing required fields: title or overview');
      }

      if (!Array.isArray(parsed.keyPoints) || !Array.isArray(parsed.actionItems)) {
        throw new Error('AI response has invalid format for keyPoints or actionItems');
      }

      return {
        title: parsed.title,
        overview: parsed.overview,
        keyPoints: parsed.keyPoints,
        actionItems: parsed.actionItems,
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        participants: Array.isArray(parsed.participants) ? parsed.participants : this.extractParticipants(request.speakers, request.speakerMapping),
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        duration: parsed.duration,
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : null,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
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
