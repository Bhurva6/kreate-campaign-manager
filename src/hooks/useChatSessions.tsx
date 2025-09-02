import { useState, useEffect } from 'react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: ChatMessage[];
};

export function useChatSessions() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Get current chat session
  const currentSession = chatSessions.find(session => session.id === currentSessionId) || null;
  
  // Create new chat session
  const createNewSession = () => {
    // Generate a more unique ID by combining timestamp with a random suffix
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      messages: []
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    return newId;
  };
  
  // Add message to current session
  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    // Create a more unique ID by combining timestamp with a random suffix
    const newMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ChatMessage = {
      ...message,
      id: newMessageId
    };
    
    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Update session with new message
        return {
          ...session,
          lastMessage: message.content || (message.imageUrl ? 'Shared an image' : ''),
          timestamp: message.timestamp,
          messages: [...session.messages, newMessage]
        };
      }
      return session;
    }));
    
    return newMessageId;
  };
  
  // Update session title based on first few messages
  useEffect(() => {
    if (currentSession?.messages.length === 1) {
      // After first user message, use that to set the title
      const firstMessage = currentSession.messages[0];
      if (firstMessage.role === 'user') {
        const title = firstMessage.content.slice(0, 20) + (firstMessage.content.length > 20 ? '...' : '');
        
        setChatSessions(prev => prev.map(session => {
          if (session.id === currentSessionId) {
            return {
              ...session,
              title
            };
          }
          return session;
        }));
      }
    }
  }, [currentSession?.messages.length, currentSessionId]);
  
  // Delete chat session
  const deleteSession = (sessionId: string) => {
    // Filter out the session to be deleted
    const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
    
    // Update the sessions list
    setChatSessions(updatedSessions);
    
    // If the current session is being deleted, switch to another session
    if (sessionId === currentSessionId) {
      if (updatedSessions.length > 0) {
        // Switch to the first available session
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        // If no sessions left, create a new one
        createNewSession();
      }
    }
    
    return true;
  };
  
  return {
    chatSessions,
    currentSessionId,
    currentSession,
    setCurrentSessionId,
    createNewSession,
    addMessage,
    deleteSession
  };
}

export default useChatSessions;
