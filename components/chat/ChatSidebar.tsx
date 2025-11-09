/**
 * Chat Session Sidebar - List of chat sessions
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, Edit2, Check, X } from 'lucide-react';
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
  onRenameSession?: (sessionId: string, newTitle: string) => void;
  isLoading?: boolean;
}

export function ChatSidebar({
  sessions,
  selectedSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  isLoading,
}: ChatSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [showInitialLoadingState, setShowInitialLoadingState] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setShowInitialLoadingState(false);
    }
  }, [isLoading, sessions.length]);

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

  const handleStartEdit = (e: React.MouseEvent, session: ChatSessionItem) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveEdit = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (editingTitle.trim() && onRenameSession) {
      await onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="relative p-3">
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
            <div className="space-y-0.5">
              {sessions.map((session, index) => (
                <div key={session.id}>
                  <div
                    className={`relative group rounded-md px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                      selectedSessionId === session.id 
                        ? 'bg-primary/10' 
                        : 'hover:bg-muted/70'
                    }`}
                    onClick={() => onSessionSelect(session.id)}
                  >
                    {/* Title row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {editingId === session.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="h-7 text-sm font-medium w-full"
                          autoFocus
                          maxLength={100}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(e as any, session.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit(e as any);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className={`font-medium text-sm truncate flex-1 ${
                          selectedSessionId === session.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {session.title}
                        </h3>
                      )}
                    </div>
                    
                    {/* Metadata and actions row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === session.id ? (
                          <>
                            <button
                              className="p-1 rounded hover:bg-primary/20 transition-colors"
                              onClick={(e) => handleSaveEdit(e, session.id)}
                            >
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted transition-colors"
                              onClick={(e) => handleCancelEdit(e)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="p-1 rounded hover:bg-primary/20 transition-colors"
                              onClick={(e) => handleStartEdit(e, session)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-destructive/20 transition-colors"
                              onClick={(e) => handleDeleteClick(session.id, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  {index < sessions.length - 1 && (
                    <div className="h-px bg-border/50 my-1.5 mx-3" />
                  )}
                </div>
              ))}
            </div>
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
