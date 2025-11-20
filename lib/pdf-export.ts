import jsPDF from "jspdf";

interface MeetingPDFData {
  title: string;
  startTime: string | null;
  duration: string;
  speakerCount: number | null;
  confidence: number | null;
  content: string;
  summary?: string;
  actionPoints?: any[];
  keyTopics?: any[];
  participants?: any[];
  sentiment?: string | null;
  // New AssemblyAI fields
  aiSummary?: string;
  iabCategories?: Array<{ category: string; relevance: number }>;
  entities?: Array<{ text: string; type: string }>;
  sentimentAnalysis?: Array<{ text: string; sentiment: string; confidence: number }>;
  speakers?: Array<{ speaker: string; text: string }>;
  // Additional summary fields
  keyMoments?: Array<{ description: string }>;
  todos?: Array<{ task: string }>;
}

export function exportMeetingToPDF(
  data: MeetingPDFData, 
  type: "transcript" | "summary" | "full",
  returnBase64: boolean = false
): string {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Helper function to add text with auto-wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    if (isBold) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(fontSize);

    const lines = doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });

    yPosition += 5; // Add spacing after text
  };

  // Add header
  doc.setFillColor(37, 99, 235); // Blue color
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Meeting Report", margin, 20);
  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Add meeting title
  addText(data.title, 18, true);
  yPosition += 5;

  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  if (data.startTime) {
    addText(`Date: ${new Date(data.startTime).toLocaleString()}`, 10);
  }
  if (data.duration) {
    addText(`Duration: ${data.duration}`, 10);
  }
  if (data.speakerCount) {
    addText(`Speakers: ${data.speakerCount}`, 10);
  }
  if (data.confidence) {
    addText(`Confidence: ${data.confidence}%`, 10);
  }
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  const addTranscriptSection = () => {
    if (!data.content) return;
    addText("TRANSCRIPT", 16, true);
    yPosition += 5;
    addText(data.content, 11);
    yPosition += 10;
  };

  // Add content based on type
  if (type === "transcript") {
    addTranscriptSection();
  }

  if (type === "summary" || type === "full") {
    if (data.summary) {
      addText("MEETING SUMMARY", 16, true);
      yPosition += 5;
      addText(data.summary, 11);
      yPosition += 10;

      // Action Points
      if (data.actionPoints && data.actionPoints.length > 0) {
        addText("ACTION POINTS", 14, true);
        yPosition += 5;
        data.actionPoints.forEach((point: any, index: number) => {
          const pointText = typeof point === "string" ? point : point.text || JSON.stringify(point);
          addText(`${index + 1}. ${pointText}`, 11);
        });
        yPosition += 10;
      }

      // Key Topics
      if (data.keyTopics && data.keyTopics.length > 0) {
        addText("KEY TOPICS", 14, true);
        yPosition += 5;
        const topics = data.keyTopics
          .map((topic: any) => (typeof topic === "string" ? topic : topic.name || JSON.stringify(topic)))
          .join(", ");
        addText(topics, 11);
        yPosition += 10;
      }

      // Participants
      if (data.participants && data.participants.length > 0) {
        addText("PARTICIPANTS", 14, true);
        yPosition += 5;
        const participants = data.participants
          .map((p: any) => (typeof p === "string" ? p : p.name || JSON.stringify(p)))
          .join(", ");
        addText(participants, 11);
        yPosition += 10;
      }

      // Sentiment
      if (data.sentiment) {
        addText("OVERALL SENTIMENT", 14, true);
        yPosition += 5;
        addText(data.sentiment.toUpperCase(), 11, true);
      }

      // Key Moments
      if (data.keyMoments && data.keyMoments.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        addText("KEY MOMENTS", 14, true);
        yPosition += 5;
        data.keyMoments.forEach((moment: any, index: number) => {
          const momentText = typeof moment === "string" ? moment : moment.description || JSON.stringify(moment);
          addText(`${index + 1}. ${momentText}`, 11);
        });
        yPosition += 10;
      }

      // To-Dos
      if (data.todos && data.todos.length > 0) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        addText("TO-DOS", 14, true);
        yPosition += 5;
        data.todos.forEach((todo: any, index: number) => {
          const todoText = typeof todo === "string" ? todo : todo.task || JSON.stringify(todo);
          addText(`${index + 1}. ${todoText}`, 11);
        });
        yPosition += 10;
      }
    }

    // AI Summary (AssemblyAI)
    if (data.aiSummary) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      addText("AI-GENERATED SUMMARY", 14, true);
      yPosition += 5;
      addText(data.aiSummary, 11);
      yPosition += 10;
    }

    // IAB Categories (Topics)
    if (data.iabCategories && data.iabCategories.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }
      addText("TOPICS DISCUSSED (IAB CATEGORIES)", 14, true);
      yPosition += 5;
      data.iabCategories.forEach((item) => {
        const categoryName = item.category.split('>').pop() || item.category;
        const relevance = (item.relevance * 100).toFixed(0);
        addText(`• ${categoryName} (${relevance}% relevance)`, 11);
      });
      yPosition += 10;
    }

    // Entity Highlights
    if (data.entities && data.entities.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
      addText("KEY ENTITIES MENTIONED", 14, true);
      yPosition += 5;

      // Group entities by type
      const entityTypes = data.entities.reduce((acc: any, entity) => {
        if (!acc[entity.type]) acc[entity.type] = [];
        acc[entity.type].push(entity.text);
        return acc;
      }, {});

      Object.entries(entityTypes).forEach(([type, entities]: [string, any]) => {
        const typeLabel = type.replace(/_/g, ' ').toUpperCase();
        addText(`${typeLabel}:`, 12, true);
        const entityList = Array.from(new Set(entities)).join(', ');
        addText(entityList, 10);
        yPosition += 3;
      });
      yPosition += 10;
    }

    // Sentiment Analysis Details
    if (data.sentimentAnalysis && data.sentimentAnalysis.length > 0) {
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }
      addText("SENTIMENT ANALYSIS", 14, true);
      yPosition += 5;

      // Calculate sentiment distribution
      const sentimentCounts = data.sentimentAnalysis.reduce((acc: any, item) => {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        return acc;
      }, {});

      const total = data.sentimentAnalysis.length;
      Object.entries(sentimentCounts).forEach(([sentiment, count]: [string, any]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        addText(`${sentiment}: ${count} (${percentage}%)`, 11);
      });
      yPosition += 10;
    }

    // Speaker Breakdown
    if (data.speakers && data.speakers.length > 0) {
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }
      addText("SPEAKER BREAKDOWN", 14, true);
      yPosition += 5;

      // Calculate speaking time per speaker
      const speakerStats = data.speakers.reduce((acc: any, item) => {
        if (!acc[item.speaker]) {
          acc[item.speaker] = { count: 0, words: 0 };
        }
        acc[item.speaker].count += 1;
        acc[item.speaker].words += item.text.split(' ').length;
        return acc;
      }, {});

      Object.entries(speakerStats).forEach(([speaker, stats]: [string, any]) => {
        addText(`Speaker ${speaker}: ${stats.count} utterances, ~${stats.words} words`, 11);
      });
      yPosition += 10;
    }
  }

  if (type === "full") {
    doc.addPage();
    yPosition = 20;
    addTranscriptSection();
  }

  // Add footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  // Generate filename
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${data.title.replace(/[^a-z0-9]/gi, "_")}_${type}_${timestamp}.pdf`;

  // Return base64 or save and return filename
  if (returnBase64) {
    const pdfBase64 = doc.output("dataurlstring");
    // Remove the data:application/pdf;filename=generated.pdf;base64, prefix
    return pdfBase64.split(",")[1];
  } else {
    doc.save(filename);
    return filename;
  }
}
