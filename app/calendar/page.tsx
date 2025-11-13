"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Mic, ChevronLeft, ChevronRight, Play, Sparkles } from "lucide-react"
import { format, isSameDay } from "date-fns"
import Link from "next/link"

interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  attendees?: Array<{ email: string }>
}

interface Recording {
  id: string
  title: string
  description: string | null
  status: string
  recordedAt: string
  createdAt: string
  audioFileUrl: string
  meetingId?: string | null
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch calendar events
      const eventsResponse = await fetch("/api/calendar/sync")
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData.events || [])
      }

      // Fetch recordings
      const recordingsResponse = await fetch("/api/recordings?limit=100")
      if (recordingsResponse.ok) {
        const recordingsData = await recordingsResponse.json()
        setRecordings(recordingsData.recordings || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return events.filter(event => {
      const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!)
      return (
        eventDate.getDate() === targetDate.getDate() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getFullYear() === targetDate.getFullYear()
      )
    })
  }

  const getRecordingsForDay = (day: number) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return recordings.filter(recording => {
      const recordingDate = new Date(recording.recordedAt || recording.createdAt)
      return (
        recordingDate.getDate() === targetDate.getDate() &&
        recordingDate.getMonth() === targetDate.getMonth() &&
        recordingDate.getFullYear() === targetDate.getFullYear()
      )
    })
  }

  const getDataForSelectedDate = () => {
    const dayEvents = events.filter(event => {
      const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!)
      return isSameDay(eventDate, selectedDate)
    })

    const dayRecordings = recordings.filter(recording => {
      const recordingDate = new Date(recording.recordedAt || recording.createdAt)
      return isSameDay(recordingDate, selectedDate)
    })

    return { events: dayEvents, recordings: dayRecordings }
  }

  const hasActivityOnDay = (day: number) => {
    const dayEvents = getEventsForDay(day)
    const dayRecordings = getRecordingsForDay(day)
    return dayEvents.length > 0 || dayRecordings.length > 0
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    )
  }

  const isSelectedDate = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    )
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(newDate)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20"
      case "processing":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20"
      case "pending":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20"
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const { events: selectedDayEvents, recordings: selectedDayRecordings } = getDataForSelectedDate()

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-8">
        {/* Header with gradient - same size as dashboard */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-8">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
          <div className="relative">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
                <h1 className="text-4xl font-medium tracking-tight text-foreground">Calendar</h1>
              </div>
              <p className="text-muted-foreground text-lg max-w-2xl">
                View your meetings and recordings organized by date with AI-powered insights.
              </p>
            </div>
          </div>
        </div>

        {/* Split View: Calendar + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-20rem)] max-w-full">
          {/* Left: Calendar */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col h-full min-h-0">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentMonth(new Date())
                        setSelectedDate(new Date())
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 flex-1 overflow-auto min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {/* Day Headers */}
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Empty cells before first day */}
                    {emptyDays.map((_, index) => (
                      <div key={`empty-${index}`} className="bg-card min-h-[70px]"></div>
                    ))}

                    {/* Calendar days */}
                    {days.map((day) => {
                      const dayEvents = getEventsForDay(day)
                      const dayRecordings = getRecordingsForDay(day)
                      const today = isToday(day)
                      const selected = isSelectedDate(day)
                      const hasActivity = hasActivityOnDay(day)

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`bg-card min-h-[70px] p-1.5 hover:bg-accent transition-colors text-left relative ${
                            today ? "ring-2 ring-primary ring-inset" : ""
                          } ${
                            selected ? "bg-accent" : ""
                          }`}
                        >
                          <div
                            className={`text-xs font-semibold mb-0.5 ${
                              today
                                ? "flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {day}
                          </div>
                          
                          {/* Activity indicators */}
                          <div className="space-y-0.5">
                            {dayEvents.length > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-chart-2">
                                <CalendarIcon className="w-2.5 h-2.5" />
                                <span>{dayEvents.length}</span>
                              </div>
                            )}
                            {dayRecordings.length > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-chart-1">
                                <Mic className="w-2.5 h-2.5" />
                                <span>{dayRecordings.length}</span>
                              </div>
                            )}
                          </div>

                          {/* Selection indicator */}
                          {selected && (
                            <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded pointer-events-none"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Detail Panel for Selected Date */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col h-full min-h-0">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-base font-medium">
                  {format(selectedDate, "EEEE, MMM d")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedDayEvents.length + selectedDayRecordings.length === 0
                    ? "No activities"
                    : `${selectedDayEvents.length + selectedDayRecordings.length} item${selectedDayEvents.length + selectedDayRecordings.length !== 1 ? "s" : ""}`}
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pb-4 min-h-0 max-h-full">
                {selectedDayEvents.length === 0 && selectedDayRecordings.length === 0 ? (
                  /* Empty State - Centered */
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        No meetings or recordings on this day
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a different date to view activities
                      </p>
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  {/* Calendar Events */}
                  {selectedDayEvents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-chart-2" />
                        Meetings ({selectedDayEvents.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 bg-chart-2/10 border border-chart-2/20 rounded-lg hover:bg-chart-2/20 transition-colors"
                          >
                            <div className="font-medium text-sm text-foreground truncate">
                              {event.summary}
                            </div>
                            {event.start.dateTime && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.start.dateTime), "h:mm a")}
                                {event.end.dateTime && (
                                  <> - {format(new Date(event.end.dateTime), "h:mm a")}</>
                                )}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Users className="w-3 h-3" />
                                {event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recordings */}
                  {selectedDayRecordings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Mic className="w-4 h-4 text-chart-1" />
                        Recordings ({selectedDayRecordings.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayRecordings.map((recording) => (
                          <Link
                            key={recording.id}
                            href={`/meetings/${recording.id}`}
                            className="block"
                          >
                            <div className="p-3 bg-chart-1/10 border border-chart-1/20 rounded-lg hover:bg-chart-1/20 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-foreground truncate">
                                    {recording.title}
                                  </div>
                                  {recording.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {recording.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(recording.recordedAt || recording.createdAt), "h:mm a")}
                                  </div>
                                </div>
                                <Badge className={getStatusColor(recording.status)}>
                                  {recording.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Play className="w-3 h-3 text-chart-1" />
                                <span className="text-xs text-chart-1">View Transcript</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
