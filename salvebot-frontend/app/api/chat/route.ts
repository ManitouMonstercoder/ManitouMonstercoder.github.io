import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

async function sendToRAGBackend(
  chatbotId: string,
  message: string,
  domain: string,
  sessionId?: string
): Promise<{ response: string; sessionId: string }> {
  const response = await fetch('https://salvebot-api.fideleamazing.workers.dev/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatbotId,
      message,
      domain,
      sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`RAG Backend Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;
    
    // Get chatbot info from URL params or headers
    const url = new URL(req.url);
    const chatbotId = url.searchParams.get('chatbotId') || req.headers.get('x-chatbot-id');
    const domain = url.searchParams.get('domain') || req.headers.get('x-domain');
    const sessionId = url.searchParams.get('sessionId') || req.headers.get('x-session-id');

    // For now, use default values for testing - in production this should come from chatbot lookup
    const defaultChatbotId = 'cm4jmxlwh00016wvd37bxo14x'; // Replace with actual ID
    const defaultDomain = 'localhost';

    const finalChatbotId = chatbotId || defaultChatbotId;
    const finalDomain = domain || defaultDomain;

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Invalid message format', { status: 400 });
    }

    // Use our RAG backend for the actual AI response
    try {
      const ragResponse = await sendToRAGBackend(
        finalChatbotId,
        lastMessage.content,
        finalDomain,
        sessionId
      );

      // Return the RAG response using AI SDK's streaming format
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "system",
            content: `Return this exact response: ${ragResponse.response}`
          },
          {
            role: "user", 
            content: "Please return the response provided in the system message."
          }
        ],
      });

      return result.toTextStreamResponse({
        headers: {
          'X-Session-ID': ragResponse.sessionId,
        },
      });

    } catch (ragError: any) {
      console.error('RAG Backend Error:', ragError);
      
      // Fallback to direct OpenAI if RAG backend fails
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: convertToModelMessages(messages),
        system: "You are a helpful AI assistant. If the user asks about specific company information, let them know that the chatbot's knowledge base is temporarily unavailable."
      });

      return result.toTextStreamResponse({
        headers: {
          'X-Fallback': 'true',
        },
      });
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}