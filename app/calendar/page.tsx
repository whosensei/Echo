"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react"
import { format } from "date-fns"

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/calendar/sync")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Error fetching events:", error)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
            <p className="text-muted-foreground">View your meetings and scheduled events</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {/* Day Headers */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="bg-muted p-3 text-center text-sm font-semibold text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Empty cells before first day */}
                  {emptyDays.map((_, index) => (
                    <div key={`empty-${index}`} className="bg-card min-h-[120px] p-2"></div>
                  ))}

                  {/* Calendar days */}
                  {days.map((day) => {
                    const dayEvents = getEventsForDay(day)
                    const today = isToday(day)

                    return (
                      <div
                        key={day}
                        className={`bg-card min-h-[120px] p-2 hover:bg-accent/50 transition-colors ${
                          today ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div
                          className={`text-sm font-semibold mb-1 ${
                            today
                              ? "flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                              title={event.summary}
                            >
                              {event.start.dateTime && (
                                <span className="font-medium">
                                  {format(new Date(event.start.dateTime), "HH:mm")}{" "}
                                </span>
                              )}
                              {event.summary}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Upcoming Events List */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Upcoming Events
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No upcoming events found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {events.slice(0, 10).map((event) => (
                        <Card key={event.id} className="hover:bg-accent/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <CalendarIcon className="w-6 h-6 text-primary" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate">
                                  {event.summary}
                                </h4>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2">
                                  {event.start.dateTime && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="w-4 h-4" />
                                      {format(new Date(event.start.dateTime), "MMM d, h:mm a")}
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="w-4 h-4" />
                                      {event.location}
                                    </div>
                                  )}
                                  {event.attendees && event.attendees.length > 0 && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Users className="w-4 h-4" />
                                      {event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
