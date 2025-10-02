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
}

export function exportMeetingToPDF(data: MeetingPDFData, type: "transcript" | "summary" | "full") {
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

  // Add content based on type
  if (type === "transcript" || type === "full") {
    addText("TRANSCRIPT", 16, true);
    yPosition += 5;
    addText(data.content, 11);
    yPosition += 10;
  }

  if ((type === "summary" || type === "full") && data.summary) {
    if (type === "full") {
      doc.addPage();
      yPosition = 20;
    }

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

  // Save the PDF
  doc.save(filename);

  return filename;
}
