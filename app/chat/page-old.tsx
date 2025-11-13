"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { TranscriptSelector } from '@/components/chat/TranscriptSelector';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/toaster';
import { getDefaultModel } from '@/lib/ai-models';
import {
  Paperclip,
  X,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ChatSessionItem {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  attachmentCount: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

interface Attachment {
  id: string;
  recordingId: string;
  recording: {
    title: string;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTranscriptSelector, setShowTranscriptSelector] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    
    // Check for pre-attached recording from URL
    const recordingId = searchParams.get('recordingId');
    if (recordingId) {
      handleNewChat([recordingId]);
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(sessionId);
        setMessages(data.messages || []);
        setAttachments(data.attachments || []);
        setSelectedModel(data.session.model || getDefaultModel());
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat session',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleNewChat = async (preAttachedRecordingIds: string[] = []) => {
    const title = `Chat ${new Date().toLocaleString()}`;
    
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          model: selectedModel,
          attachedRecordingIds: preAttachedRecordingIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadSessions();
        await loadSession(data.session.id);
        toast({
          title: 'Success',
          description: 'New chat created',
        });
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          setAttachments([]);
        }
        toast({
          title: 'Success',
          description: 'Chat deleted',
        });
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    }
  };

  const handleAttachTranscripts = async (recordingIds: string[]) => {
    // For simplicity, we'll just reload the session to get updated attachments
    if (currentSessionId) {
      await loadSession(currentSessionId);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      toast({
        title: 'Error',
        description: 'Please create or select a chat session first',
        variant: 'destructive',
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoadingResponse(true);

    try {
      // Save user message
      await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content,
        }),
      });

      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          model: selectedModel,
          attachedRecordingIds: attachments.map((a) => a.recordingId),
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoadingResponse(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] gap-4">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <ChatSidebar
              sessions={sessions}
              selectedSessionId={currentSessionId}
              onSessionSelect={loadSession}
              onNewChat={() => handleNewChat()}
              onDeleteSession={handleDeleteSession}
              isLoading={isLoadingSessions}
            />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {currentSessionId ? (
              <>
                {/* Header */}
                <Card className="p-4 flex-shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        disabled={isLoadingResponse}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTranscriptSelector(true)}
                      disabled={isLoadingResponse}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach Transcripts
                    </Button>
                  </div>

                  {/* Attached Transcripts */}
                  {attachments.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                          <Badge key={attachment.id} variant="secondary" className="gap-2">
                            <FileText className="h-3 w-3" />
                            {attachment.recording.title}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                  {isLoadingSession ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                      <p className="text-muted-foreground max-w-md">
                        Ask questions about your meetings, request summaries, or have a conversation with AI.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {messages.map((message: any) => (
                        <ChatMessage key={message.id} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t flex-shrink-0">
                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={isLoadingResponse}
                    placeholder={
                      isLoadingResponse
                        ? 'AI is thinking...'
                        : 'Ask a question about your meetings...'
                    }
                  />
                </div>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No chat selected</h3>
                  <p className="text-muted-foreground mb-6">
                    Create a new chat or select an existing one from the sidebar to start.
                  </p>
                  <Button onClick={() => handleNewChat()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Transcript Selector Dialog */}
        <TranscriptSelector
          open={showTranscriptSelector}
          onOpenChange={setShowTranscriptSelector}
          onAttach={handleAttachTranscripts}
          alreadyAttachedIds={attachments.map((a) => a.recordingId)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
