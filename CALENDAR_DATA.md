# Google Calendar API - Available Data

## 📅 Meeting Information You Can Extract

### ✅ Basic Information
- **Meeting Title** (`summary`)
- **Description** (`description`)
- **Location** (`location`) - Physical location or address
- **Status** (`status`) - confirmed, tentative, cancelled
- **Visibility** (`visibility`) - default, public, private
- **HTML Link** - Direct link to event in Google Calendar

### 👥 Participants Data

#### Organizer
```typescript
{
  email: "organizer@example.com",
  displayName: "John Doe",
  self: false  // true if you're the organizer
}
```

#### Attendees (Array)
```typescript
{
  email: "attendee@example.com",
  displayName: "Jane Smith",
  responseStatus: "accepted" | "declined" | "tentative" | "needsAction",
  organizer: false,  // true if they're the organizer
  self: false,       // true if this is you
  optional: false    // true if attendance is optional
}
```

#### Creator
```typescript
{
  email: "creator@example.com",
  displayName: "Creator Name"
}
```

### ⏰ Timing Information

#### Start & End Times
```typescript
start: {
  dateTime: "2025-10-15T14:00:00-07:00",  // With time
  date: "2025-10-15",                     // All-day events
  timeZone: "America/Los_Angeles"
}
end: {
  dateTime: "2025-10-15T15:00:00-07:00",
  date: "2025-10-15",
  timeZone: "America/Los_Angeles"
}
```

#### Calculated Duration
- Duration in milliseconds
- Duration in minutes
- Formatted duration (e.g., "1h 30m")
- Is all-day event?
- Is past/upcoming/ongoing?

### 🎥 Conference Data

#### Video Meeting Info
```typescript
conferenceData: {
  conferenceId: "abc-defg-hij",
  conferenceSolution: {
    name: "Google Meet" | "Zoom" | "Microsoft Teams"
  },
  entryPoints: [
    {
      entryPointType: "video",
      uri: "https://meet.google.com/abc-defg-hij",
      label: "meet.google.com/abc-defg-hij"
    },
    {
      entryPointType: "phone",
      uri: "tel:+1-234-567-8900",
      label: "+1 234-567-8900"
    }
  ]
}
```

#### Quick Links
- **hangoutLink** - Direct Google Meet link
- **htmlLink** - Google Calendar event page

### 🔔 Reminders
```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: "email", minutes: 1440 },  // 24 hours before
    { method: "popup", minutes: 10 }     // 10 minutes before
  ]
}
```

### 🔄 Recurring Events
- **recurringEventId** - ID of the recurring event series
- Single instance vs recurring event identifier

### 📊 Metadata
- **created** - When the event was created
- **updated** - When the event was last updated
- **id** - Unique event ID

## 🛠️ Helper Functions Available

### 1. Get Upcoming Meetings
```typescript
const meetings = await getUpcomingMeetings(userId, 5);
// Returns next 5 upcoming meetings with all data
```

### 2. Get Past Meetings
```typescript
const pastMeetings = await getPastMeetings(userId, 10);
// Returns last 10 meetings from past 30 days
```

### 3. Get Meeting Details
```typescript
const details = await getMeetingDetails(userId, eventId);
// Returns:
{
  event: {...},           // Full event data
  participants: {
    organizer: {...},
    attendees: [...],
    total: 5,
    summary: {
      accepted: 3,
      declined: 1,
      tentative: 0,
      pending: 1
    }
  },
  timing: {
    start: Date,
    end: Date,
    duration: {
      minutes: 60,
      formatted: "1h 0m"
    },
    isUpcoming: true,
    isPast: false,
    isOngoing: false
  },
  conferenceInfo: {
    provider: "Google Meet",
    joinUrl: "https://meet.google.com/...",
    phoneNumbers: [...]
  }
}
```

### 4. Format Participants
```typescript
const participants = formatParticipants(event);
// Returns formatted participant list with response status
```

### 5. Format Timing
```typescript
const timing = formatMeetingTiming(event);
// Returns formatted timing with duration calculation
```

### 6. Sync to Database
```typescript
await syncMeetingToDatabase(userId, eventId);
// Saves meeting to your database with all participant data
```

## 💡 Usage Examples

### Example 1: Display Upcoming Meetings with Participants
```typescript
const meetings = await getUpcomingMeetings(userId, 5);

meetings.forEach(meeting => {
  const participants = formatParticipants(meeting);
  const timing = formatMeetingTiming(meeting);
  
  console.log(`
    Meeting: ${meeting.summary}
    When: ${timing?.start.toLocaleString()}
    Duration: ${timing?.duration.formatted}
    Organizer: ${participants.organizer?.name}
    Attendees: ${participants.total} people
    Accepted: ${participants.summary.accepted}
    Location: ${meeting.location || 'No location'}
    Join: ${meeting.hangoutLink || 'No video link'}
  `);
});
```

### Example 2: Get Meeting for Email
```typescript
const details = await getMeetingDetails(userId, eventId);

if (details) {
  // Send email with:
  const emailData = {
    title: details.event.summary,
    startTime: details.timing?.start.toLocaleString(),
    duration: details.timing?.duration.formatted,
    participants: details.participants.attendees.map(a => a.email),
    joinLink: details.conferenceInfo?.joinUrl,
    location: details.event.location
  };
  
  await sendSummaryEmail(userId, eventId, emailData);
}
```

### Example 3: Check Meeting Status
```typescript
const meetings = await getUpcomingMeetings(userId);

for (const meeting of meetings) {
  const timing = formatMeetingTiming(meeting);
  const participants = formatParticipants(meeting);
  
  if (timing?.isUpcoming && timing.start.getTime() - Date.now() < 15 * 60 * 1000) {
    // Meeting starts in less than 15 minutes!
    console.log(`Reminder: ${meeting.summary} starts soon!`);
    console.log(`Join: ${meeting.hangoutLink}`);
    console.log(`Participants: ${participants.total} people`);
  }
}
```

### Example 4: Participant Analysis
```typescript
const details = await getMeetingDetails(userId, eventId);

if (details) {
  const { participants } = details;
  
  console.log(`Total invited: ${participants.total}`);
  console.log(`Accepted: ${participants.summary.accepted}`);
  console.log(`Declined: ${participants.summary.declined}`);
  console.log(`Haven't responded: ${participants.summary.pending}`);
  
  // List who declined
  const declined = participants.attendees.filter(a => a.status === 'declined');
  console.log('Declined:', declined.map(a => a.name).join(', '));
}
```

## 🗄️ Database Storage

When you sync a meeting to the database, it stores:

```typescript
meeting: {
  id: uuid,
  userId: string,
  title: meeting.summary,
  description: meeting.description,
  startTime: Date,
  endTime: Date,
  calendarEventId: meeting.id,  // Link to Google Calendar
  status: "pending" | "completed",
  // ... more fields
}
```

The participant data can be stored in the `summary` table's metadata:

```typescript
summary: {
  participants: [
    {
      email: "user@example.com",
      name: "User Name",
      status: "accepted"
    }
  ]
}
```

## 🎯 Real-World Use Cases

### 1. **Pre-Meeting Preparation**
- Extract participant list
- Send meeting materials to attendees
- Check who has accepted/declined

### 2. **Post-Meeting Summary**
- Include participant list in summary
- Send transcript to all attendees
- Track action items per participant

### 3. **Meeting Analytics**
- Track meeting attendance rates
- Analyze meeting durations
- Monitor conference provider usage

### 4. **Automated Reminders**
- Send reminders to pending attendees
- Alert about upcoming meetings
- Notify about schedule changes

### 5. **Integration with Transcripts**
- Match audio recording to calendar event
- Auto-populate meeting title and time
- Include participant names in transcript

## 📝 Notes

- **Privacy**: Respect participant privacy
- **Permissions**: Requires `calendar.readonly` scope
- **Rate Limits**: Google has API rate limits
- **Timezone**: Always handle timezones properly
- **All-Day Events**: Use `date` field instead of `dateTime`

## 🔐 Required OAuth Scope

Already included in your Better Auth configuration:
```typescript
"https://www.googleapis.com/auth/calendar.readonly"
```

This allows reading calendar data including participants and timing information.
