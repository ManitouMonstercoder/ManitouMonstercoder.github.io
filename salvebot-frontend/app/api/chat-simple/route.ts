export async function POST(req: Request) {
  console.log('POST /api/chat-simple called');
  
  try {
    // Parse request body
    const body = await req.json();
    const { messages } = body;
    
    // Get parameters from URL
    const url = new URL(req.url);
    const chatbotId = url.searchParams.get('chatbotId') || 'default-bot';
    const domain = url.searchParams.get('domain') || 'localhost';
    
    console.log('Chat request:', { chatbotId, domain, messageCount: messages?.length });
    
    // Get the last user message
    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('User message:', lastMessage.content);
    
    try {
      // Send to RAG backend
      const response = await fetch('https://salvebot-api.fideleamazing.workers.dev/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId,
          message: lastMessage.content,
          domain,
        }),
      });
      
      console.log('RAG response status:', response.status);
      
      if (response.ok) {
        const ragData = await response.json();
        console.log('RAG response:', ragData);
        
        return new Response(JSON.stringify({
          response: ragData.response || 'I received your message.',
          sessionId: ragData.sessionId || 'test-session'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(`RAG API returned ${response.status}`);
      }
      
    } catch (ragError) {
      console.error('RAG error:', ragError);
      
      // Fallback response
      return new Response(JSON.stringify({
        response: `I received your message: "${lastMessage.content}". This is a test response from the fallback system.`,
        sessionId: 'fallback-session'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error: any) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Simple chat API is working',
    timestamp: new Date().toISOString() 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}