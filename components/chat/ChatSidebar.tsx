/**
 * Chat Session Sidebar - List of chat sessions
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSessionItem {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  attachmentCount: number;
}

interface ChatSidebarProps {
  sessions: ChatSessionItem[];
  selectedSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  sessions,
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isLoading,
}: ChatSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const showInitialLoadingState = Boolean(isLoading && sessions.length === 0);

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
  <div className="relative p-2 space-y-2">
          {showInitialLoadingState ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-8 text-sm text-muted-foreground">
              No chat sessions yet.
              <br />
              Click "New Chat" to start!
            </div>
          ) : (
            sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent group shadow-none ${
                  selectedSessionId === session.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <h3 className="font-medium text-sm truncate">{session.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.messageCount} messages
                      {session.attachmentCount > 0 && ` • ${session.attachmentCount} attachments`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                    onClick={(e) => handleDeleteClick(session.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
          {isLoading && sessions.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating chats…
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
