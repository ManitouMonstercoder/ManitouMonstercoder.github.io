import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not found in environment variables');
}

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
    
    console.log('Chat API called with:', { messagesCount: messages?.length });
    
    // Get chatbot info from URL params, headers, or use defaults
    const url = new URL(req.url);
    const chatbotId = url.searchParams.get('chatbotId') || req.headers.get('x-chatbot-id');
    const domain = url.searchParams.get('domain') || req.headers.get('x-domain');
    const sessionId = url.searchParams.get('sessionId') || req.headers.get('x-session-id');

    console.log('Parameters:', { chatbotId, domain, sessionId });

    // Use default values for testing
    const defaultChatbotId = 'cm4jmxlwh00016wvd37bxo14x'; // Replace with actual ID
    const defaultDomain = 'localhost';

    const finalChatbotId = chatbotId || defaultChatbotId;
    const finalDomain = domain || defaultDomain;

    console.log('Using:', { finalChatbotId, finalDomain });

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages:', messages);
      return new Response('No messages provided', { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      console.error('Invalid last message:', lastMessage);
      return new Response('Invalid message format', { status: 400 });
    }

    console.log('User message:', lastMessage.content);

    // Use our RAG backend for the actual AI response
    try {
      console.log('Sending to RAG backend...');
      const ragResponse = await sendToRAGBackend(
        finalChatbotId,
        lastMessage.content,
        finalDomain,
        sessionId
      );

      console.log('RAG Response received:', ragResponse);

      // Check if OpenAI is available, if not return simple response
      if (!process.env.OPENAI_API_KEY) {
        console.log('No OpenAI key, returning RAG response directly');
        
        // Return a simple streaming response without OpenAI
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const response = ragResponse.response;
            const chunks = response.split(' ');
            
            let i = 0;
            const interval = setInterval(() => {
              if (i < chunks.length) {
                controller.enqueue(encoder.encode(chunks[i] + ' '));
                i++;
              } else {
                clearInterval(interval);
                controller.close();
              }
            }, 50);
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Session-ID': ragResponse.sessionId || 'test-session',
          },
        });
      }

      // Use OpenAI streaming if available
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [
          {
            role: "assistant",
            content: ragResponse.response
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
      
      // Simple fallback without OpenAI
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const fallbackResponse = "I'm having trouble connecting to the knowledge base right now. How can I help you in the meantime?";
          controller.enqueue(encoder.encode(fallbackResponse));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Fallback': 'true',
        },
      });
    }

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}