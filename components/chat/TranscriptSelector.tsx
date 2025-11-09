/**
 * Transcript Selector Component - Dialog to attach recordings to chat
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Calendar, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Recording {
  id: string;
  title: string;
  description: string | null;
  recordedAt: string;
  status: string;
}

interface TranscriptSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (recordingIds: string[]) => void;
  alreadyAttachedIds?: string[];
}

export function TranscriptSelector({
  open,
  onOpenChange,
  onAttach,
  alreadyAttachedIds = [],
}: TranscriptSelectorProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecordings();
    }
  }, [open]);

  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/recordings');
      if (response.ok) {
        const data = await response.json();
        setRecordings(data.recordings || []);
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (recordingId: string) => {
    setSelectedIds((prev) =>
      prev.includes(recordingId)
        ? prev.filter((id) => id !== recordingId)
        : [...prev, recordingId]
    );
  };

  const handleAttach = () => {
    onAttach(selectedIds);
    setSelectedIds([]);
    onOpenChange(false);
  };

  const availableRecordings = recordings.filter(
    (rec) => !alreadyAttachedIds.includes(rec.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Attach Meeting Transcripts</DialogTitle>
          <DialogDescription>
            Select recordings to provide context for your chat session.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableRecordings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileAudio className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recordings available to attach.</p>
              <p className="text-sm mt-2">
                {alreadyAttachedIds.length > 0
                  ? 'All recordings are already attached to this chat.'
                  : 'Record a meeting first to use this feature.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRecordings.map((recording) => (
                <Card
                  key={recording.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                    selectedIds.includes(recording.id) ? 'border-primary bg-accent' : ''
                  }`}
                  onClick={() => handleToggle(recording.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.includes(recording.id)}
                      onCheckedChange={() => handleToggle(recording.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="font-medium text-sm truncate">{recording.title}</h3>
                        <Badge
                          variant={recording.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {recording.status}
                        </Badge>
                      </div>
                      {recording.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {recording.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(recording.recordedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={selectedIds.length === 0}>
            Attach {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
