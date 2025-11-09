"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, Users, Mail } from "lucide-react";

interface MeetingParticipant {
  email: string;
  name: string;
  status: "accepted" | "declined" | "tentative" | "needsAction";
  isOrganizer: boolean;
  isYou: boolean;
  isOptional: boolean;
}

interface MeetingDetailsProps {
  meetingId: string;
}

export function MeetingDetailsCard({ meetingId }: MeetingDetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await fetch(`/api/calendar/meeting/${meetingId}`);
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading meeting details...</div>;
  }

  if (!details) {
    return <div>Meeting not found</div>;
  }

  const { event, participants, timing, conferenceInfo } = details;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "declined":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "tentative":
        return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Meeting Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.summary}</CardTitle>
              {event.description && (
                <CardDescription className="mt-2">{event.description}</CardDescription>
              )}
            </div>
            {timing?.isUpcoming && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Upcoming
              </Badge>
            )}
            {timing?.isOngoing && (
              <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                In Progress
              </Badge>
            )}
            {timing?.isPast && (
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                Past
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time */}
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <p className="font-medium">
                {timing?.start.toLocaleString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-slate-500">
                Duration: {timing?.duration.formatted} • {timing?.timeZone}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
              <p className="text-slate-700">{event.location}</p>
            </div>
          )}

          {/* Video Conference */}
          {conferenceInfo?.joinUrl && (
            <div className="flex items-start space-x-3">
              <Video className="h-5 w-5 text-slate-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-2">
                  {conferenceInfo.provider} Meeting
                </p>
                <Button asChild size="sm">
                  <a href={conferenceInfo.joinUrl} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Participants ({participants.total})
              </CardTitle>
              <CardDescription className="mt-1">
                {participants.summary.accepted} accepted • {participants.summary.declined}{" "}
                declined • {participants.summary.pending} pending
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Organizer */}
          {participants.organizer && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm font-medium text-slate-500 mb-2">Organizer</p>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {participants.organizer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">
                    {participants.organizer.name}
                    {participants.organizer.isYou && (
                      <Badge variant="outline" className="ml-2">
                        You
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{participants.organizer.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attendees */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">Attendees</p>
            {participants.attendees.map((attendee: MeetingParticipant, index: number) => (
              <div key={index} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>{attendee.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{attendee.name}</p>
                    {attendee.isYou && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                    {attendee.isOptional && (
                      <Badge variant="outline" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{attendee.email}</p>
                </div>
                <Badge className={getStatusColor(attendee.status)}>
                  {attendee.status === "needsAction" ? "Pending" : attendee.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Response Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-chart-1">
                  {participants.summary.accepted}
                </p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-destructive">
                  {participants.summary.declined}
                </p>
                <p className="text-xs text-muted-foreground">Declined</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-chart-4">
                  {participants.summary.tentative}
                </p>
                <p className="text-xs text-muted-foreground">Tentative</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-muted-foreground">
                  {participants.summary.pending}
                </p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Send Transcript
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Send Summary
            </Button>
            <Button variant="outline" asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-4 w-4" />
                View in Calendar
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
