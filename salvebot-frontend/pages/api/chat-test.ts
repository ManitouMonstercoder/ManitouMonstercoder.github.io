import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API called:', req.method, req.url);

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'Chat test API is working',
      timestamp: new Date().toISOString() 
    });
    return;
  }

  if (req.method === 'POST') {
    try {
      const { messages } = req.body;
      const { chatbotId, domain } = req.query;

      console.log('Chat request:', { chatbotId, domain, messageCount: messages?.length });

      // Get the last user message
      const lastMessage = messages?.[messages.length - 1];
      if (!lastMessage) {
        res.status(400).json({ error: 'No message provided' });
        return;
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
            chatbotId: chatbotId || 'default-bot',
            message: lastMessage.content,
            domain: domain || 'localhost',
          }),
        });

        console.log('RAG response status:', response.status);

        if (response.ok) {
          const ragData = await response.json();
          console.log('RAG response:', ragData);

          res.status(200).json({
            response: ragData.response || 'I received your message.',
            sessionId: ragData.sessionId || 'test-session'
          });
        } else {
          throw new Error(`RAG API returned ${response.status}`);
        }

      } catch (ragError) {
        console.error('RAG error:', ragError);

        // Fallback response
        res.status(200).json({
          response: `I received your message: "${lastMessage.content}". This is a test response from the fallback system.`,
          sessionId: 'fallback-session'
        });
      }

    } catch (error: any) {
      console.error('API error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}