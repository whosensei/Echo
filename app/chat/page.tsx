"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { TranscriptSelector } from '@/components/chat/TranscriptSelector';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toaster';
import { getDefaultModel } from '@/lib/ai-models';
import { useSession, authClient } from '@/lib/auth-client';
import {
  Loader2,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  LogOut,
  Settings,
  User,
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
  recording?: {
    title?: string;
  } | null;
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel());
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTranscriptSelector, setShowTranscriptSelector] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasShownShortcutHint, setHasShownShortcutHint] = useState(false);
  const processedRecordingIdsRef = useRef<Set<string>>(new Set());

  const loadSessions = useCallback(async () => {
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
  }, [toast]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(sessionId);
        setMessages(data.messages || []);
        setAttachments(
          (data.attachments || []).map((attachment: any) => ({
            id: attachment.id,
            recordingId: attachment.recordingId,
            recording: attachment.recording ?? null,
          }))
        );
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
  }, [toast]);

  const createChatSession = useCallback(async (preAttachedRecordingIds: string[] = []) => {
    const title = `Chat ${new Date().toLocaleString()}`;

    const response = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        model: selectedModel,
        attachedRecordingIds: preAttachedRecordingIds,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    return data.session as { id: string; title: string; model: string };
  }, [selectedModel]);

  const handleNewChat = useCallback(async (preAttachedRecordingIds: string[] = []) => {
    try {
      const newSession = await createChatSession(preAttachedRecordingIds);
      await loadSessions();
      await loadSession(newSession.id);
      toast({
        title: 'Success',
        description: 'New chat created',
      });
      return true;
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new chat',
        variant: 'destructive',
      });
      return false;
    }
  }, [createChatSession, loadSession, loadSessions, toast]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Auto-create chat when arriving with a recordingId query param
  useEffect(() => {
    const recordingId = searchParams.get('recordingId');
    if (!recordingId) {
      return;
    }

    if (processedRecordingIdsRef.current.has(recordingId)) {
      return;
    }

    processedRecordingIdsRef.current.add(recordingId);

    const openChatWithRecording = async () => {
      const created = await handleNewChat([recordingId]);
      if (!created) {
        processedRecordingIdsRef.current.delete(recordingId);
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete('recordingId');
      const newQuery = params.toString();
      router.replace(newQuery ? `/chat?${newQuery}` : '/chat', { scroll: false });
    };

    void openChatWithRecording();
  }, [searchParams, router, handleNewChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keyboard shortcut for toggling sidebar (Cmd+B / Ctrl+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        
        // Show hint on first use
        if (!hasShownShortcutHint) {
          setHasShownShortcutHint(true);
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
          toast({
            title: 'Keyboard shortcut',
            description: `Press ${isMac ? '⌘' : 'Ctrl'}+B to toggle the sidebar`,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasShownShortcutHint, toast]);
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

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
        );
        toast({
          title: 'Success',
          description: 'Chat renamed',
        });
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename chat',
        variant: 'destructive',
      });
    }
  };

  const handleAttachTranscripts = async (recordingIds: string[]) => {
    if (recordingIds.length === 0) {
      return;
    }

    try {
      let sessionId = currentSessionId;

      if (!sessionId) {
        const newSession = await createChatSession(recordingIds);
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        await loadSessions();
        await loadSession(sessionId);
        toast({
          title: 'Transcripts attached',
          description:
            recordingIds.length === 1
              ? 'Transcript has been attached to your new chat.'
              : `${recordingIds.length} transcripts attached to your new chat.`,
        });
        return;
      }

      const response = await fetch('/api/chat/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recordingIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to attach transcripts');
      }

      const data = await response.json();
      setAttachments(
        (data.attachments || []).map((attachment: any) => ({
          id: attachment.id,
          recordingId: attachment.recordingId,
          recording: attachment.recording ?? null,
        }))
      );

      toast({
        title: 'Transcripts attached',
        description:
          recordingIds.length === 1
            ? 'Transcript has been attached to this chat.'
            : `${recordingIds.length} transcripts attached to this chat.`,
      });
    } catch (error) {
      console.error('Failed to attach transcripts:', error);
      toast({
        title: 'Error',
        description: 'Failed to attach transcripts',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAttachment = async (recordingId: string) => {
    if (!currentSessionId) return;

    try {
      // Remove attachment from the database
      const response = await fetch(`/api/chat/sessions/${currentSessionId}/attachments/${recordingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state
        setAttachments((prev) => prev.filter((a) => a.recordingId !== recordingId));
        toast({
          title: 'Success',
          description: 'Transcript removed',
        });
      }
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove transcript',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    let sessionId = currentSessionId;
    let newSessionCreated = false;

    if (!sessionId) {
      try {
        const newSession = await createChatSession();
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        setAttachments([]);
        setMessages([]);
        loadSessions();
        newSessionCreated = true;
      } catch (error) {
        console.error('Failed to auto-create chat:', error);
        toast({
          title: 'Error',
          description: 'Could not create a new chat session',
          variant: 'destructive',
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedContent,
      createdAt: new Date(),
    };

    const conversationHistory = newSessionCreated
      ? [userMessage]
      : [...messages, userMessage];

    setMessages((prev) =>
      newSessionCreated ? [userMessage] : [...prev, userMessage]
    );
    setIsLoadingResponse(true);

    try {
      // Save user message
      await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: trimmedContent,
        }),
      });

      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          model: selectedModel,
          attachedRecordingIds: attachments.map((a) => a.recordingId),
          messages: conversationHistory.map((m) => ({
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

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  const chatInputPlaceholder = isLoadingResponse
    ? 'AI is thinking...'
    : 'Ask anything';

  const activeChatInput = (
    <ChatInput
      className="w-full"
      onSend={handleSendMessage}
      onAttachClick={() => setShowTranscriptSelector(true)}
      attachments={attachments}
      onRemoveAttachment={handleRemoveAttachment}
      disabled={isLoadingResponse}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      placeholder={chatInputPlaceholder}
    />
  );

  const idleChatInput = (
    <ChatInput
      className="w-full"
      onSend={handleSendMessage}
      onAttachClick={() => setShowTranscriptSelector(true)}
      attachments={attachments}
      onRemoveAttachment={handleRemoveAttachment}
      disabled={isLoadingResponse}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      placeholder={chatInputPlaceholder}
    />
  );

  const showCenteredInput = !!currentSessionId && !isLoadingSession && messages.length === 0;

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Chat Sidebar */}
        <aside className={`flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
        }`}>
          {/* Header with Back Button */}
          <div className="flex items-center h-16 px-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center flex-1">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground ml-2">
                AI Chat
              </span>
            </div>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-hidden">
            <ChatSidebar
              sessions={sessions}
              selectedSessionId={currentSessionId}
              onSessionSelect={loadSession}
              onNewChat={() => handleNewChat()}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
              isLoading={isLoadingSessions}
            />
          </div>

          {/* User Menu at Bottom */}
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-xs font-medium text-muted-foreground">
                Appearance
              </span>
              <ThemeToggle />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 h-auto py-2">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate max-w-full">
                      {session?.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-full">
                      {session?.user?.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          {/* Sidebar toggle button when collapsed */}
          {isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(false)}
              className="absolute top-4 left-4 z-10 h-10 w-10 rounded-lg border bg-background shadow-sm hover:bg-accent"
              title="Show sidebar (⌘B)"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}

          {currentSessionId ? (
            <>
              <div
                className={
                  showCenteredInput
                    ? 'flex-1 flex items-center justify-center p-6'
                    : 'flex-1 overflow-y-auto'
                }
              >
                {isLoadingSession ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : showCenteredInput ? (
                  <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center gap-6 text-center px-4 relative">
                    {/* Gradient blur effects */}
                    <figure className="pointer-events-none absolute left-1/2 top-0 z-0 block aspect-square w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[200px]" />
                    
                    <div className="space-y-4 relative z-10">
                      <h1 className="text-[clamp(32px,7vw,64px)] font-medium leading-none tracking-[-1.44px] md:tracking-[-2.16px] text-foreground">
                        Talk to your recordings
                      </h1>
                      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Ask questions, get summaries, and explore insights from your meetings and transcripts.
                      </p>
                    </div>
                    <div className="w-full relative z-10">{activeChatInput}</div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-4 max-w-3xl mx-auto pb-4">
                      {messages.map((message: any) => (
                        <ChatMessage key={message.id} message={message} />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {!showCenteredInput && (
                <div className="p-4 flex-shrink-0 bg-background">
                  <div className="max-w-3xl mx-auto">
                    {activeChatInput}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 text-center relative overflow-hidden">
              {/* Gradient blur effects */}
              <figure className="pointer-events-none absolute left-1/2 top-1/4 z-0 block aspect-square w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[200px]" />
              
              <div className="space-y-4 max-w-4xl relative z-10">
                <h1 className="text-[clamp(32px,7vw,64px)] font-medium leading-none tracking-[-1.44px] md:tracking-[-2.16px] text-foreground">
                  Talk to your recordings
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Ask questions, get summaries, and explore insights from your meetings and transcripts.
                </p>
              </div>
              <div className="w-full max-w-3xl relative z-10">{idleChatInput}</div>
            </div>
          )}
        </div>

        {/* Transcript Selector Dialog */}
        <TranscriptSelector
          open={showTranscriptSelector}
          onOpenChange={setShowTranscriptSelector}
          onAttach={handleAttachTranscripts}
          alreadyAttachedIds={attachments.map((a) => a.recordingId)}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
