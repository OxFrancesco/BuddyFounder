import { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Id } from "../../convex/_generated/dataModel";

interface VoiceChatOptions {
  profileOwnerId: Id<"users">;
  profileOwnerName: string;
  onTranscript?: (transcript: string, role: 'user' | 'assistant') => void;
  onMessage?: (message: string) => void;
  vapiPublicKey?: string;
}

interface VoiceChatState {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: Array<{ role: 'user' | 'assistant'; text: string; timestamp: number }>;
  error: string | null;
}

export function useVoiceChat({
  profileOwnerId,
  profileOwnerName,
  onTranscript,
  onMessage,
  vapiPublicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY
}: VoiceChatOptions) {
  console.log(vapiPublicKey);
  const [state, setState] = useState<VoiceChatState>({
    isConnected: false,
    isSpeaking: false,
    isListening: false,
    transcript: [],
    error: null
  });

  const vapiRef = useRef<Vapi | null>(null);
  const assistantConfigRef = useRef<any>(null);

  // Initialize Vapi instance
  useEffect(() => {
    if (!vapiPublicKey) {
      setState(prev => ({ ...prev, error: 'Vapi API key not configured' }));
      return;
    }

    try {
      const vapi = new Vapi(vapiPublicKey);
      vapiRef.current = vapi;

      // Set up event listeners
      vapi.on('call-start', () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });

      vapi.on('call-end', () => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isSpeaking: false,
          isListening: false
        }));
      });

      vapi.on('speech-start', () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
      });

      vapi.on('speech-end', () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
      });

      // Note: listening events may not be available in current Vapi version
      // vapi.on('listening-start', () => {
      //   setState(prev => ({ ...prev, isListening: true }));
      // });

      // vapi.on('listening-end', () => {
      //   setState(prev => ({ ...prev, isListening: false }));
      // });

      vapi.on('message', (message: any) => {
        if (message.type === 'transcript') {
          const transcript = {
            role: message.role as 'user' | 'assistant',
            text: message.transcript,
            timestamp: Date.now()
          };

          setState(prev => ({
            ...prev,
            transcript: [...prev.transcript, transcript]
          }));

          onTranscript?.(message.transcript, message.role);
        }

        if (message.type === 'function-call') {
          // Handle function calls for integration with our backend
          handleFunctionCall(message);
        }
      });

      vapi.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setState(prev => ({ ...prev, error: error.message || 'Voice chat error' }));
      });

    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize voice chat' }));
    }

    return () => {
      vapiRef.current?.stop();
    };
  }, [vapiPublicKey, onTranscript]);

  // Create dynamic assistant configuration
  const createAssistantConfig = useCallback(() => {
    return {
      name: `${profileOwnerName} AI Assistant`,
      firstMessage: `Hi! I'm ${profileOwnerName}'s AI assistant. I can tell you about their experience, skills, and projects. What would you like to know?`,
      metadata: {
        profileOwnerId // Include profile owner ID for webhook context
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [{
          role: "system",
          content: `You are an AI assistant representing ${profileOwnerName}. Respond as if you are them, but keep responses conversational and under 30 words. Be friendly and engaging. If someone asks about details you don't know, suggest they connect directly.`
        }]
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // Default voice, can be customized per profile
        stability: 0.5,
        similarityBoost: 0.5
      },
      functions: [
        {
          name: "get_profile_info",
          description: "Get detailed information about the profile owner",
          parameters: {
            type: "object",
            properties: {
              info_type: {
                type: "string",
                enum: ["skills", "experience", "projects", "interests", "contact"],
                description: "Type of information to retrieve"
              }
            },
            required: ["info_type"]
          }
        }
      ]
    };
  }, [profileOwnerName, profileOwnerId]);

  // Handle function calls from Vapi
  const handleFunctionCall = async (message: any) => {
    const { functionCall } = message;

    if (functionCall.name === 'get_profile_info') {
      // This would integrate with our existing backend to get profile info
      try {
        // For now, return a placeholder response
        // In a real implementation, this would call our Convex backend
        const response = {
          result: `Here's information about ${profileOwnerName}'s ${functionCall.parameters.info_type}. For more details, you can connect directly through the app.`
        };

        // Send response back to Vapi
        // Note: This would typically be handled via webhook in production
        return response;
      } catch (error) {
        console.error('Function call error:', error);
      }
    }
  };

  // Start voice conversation
  const startVoiceChat = useCallback(async () => {
    if (!vapiRef.current) {
      setState(prev => ({ ...prev, error: 'Voice chat not initialized' }));
      return;
    }

    try {
      const assistantConfig = createAssistantConfig();
      assistantConfigRef.current = assistantConfig;

      // Start the conversation with dynamic assistant
      await vapiRef.current.start(assistantConfig as any);
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      setState(prev => ({ ...prev, error: 'Failed to start voice chat' }));
    }
  }, [createAssistantConfig]);

  // Stop voice conversation
  const stopVoiceChat = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  // Send text message (for mixed mode)
  const sendTextMessage = useCallback((message: string) => {
    if (vapiRef.current && state.isConnected) {
      // Add to transcript
      const transcript = {
        role: 'user' as const,
        text: message,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, transcript]
      }));

      onMessage?.(message);
    }
  }, [state.isConnected, onMessage]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: [] }));
  }, []);

  return {
    ...state,
    startVoiceChat,
    stopVoiceChat,
    sendTextMessage,
    clearTranscript,
    isInitialized: !!vapiRef.current
  };
}