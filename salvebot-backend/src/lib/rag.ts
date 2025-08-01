import OpenAI from 'openai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { DocumentChunk, Document } from '../types'
import { generateId, cosineSimilarity } from './utils'

export class RAGService {
  private openai: OpenAI
  private textSplitter: RecursiveCharacterTextSplitter

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    })
  }

  async processDocument(content: string, fileType: string): Promise<Array<{
    content: string
    embedding: number[]
    metadata: { page?: number; section?: string }
  }>> {
    // Preprocess content based on file type
    let processedContent = content
    
    if (fileType === 'application/pdf') {
      // For PDFs, we assume the content has already been extracted
      // Clean up common PDF artifacts
      processedContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    } else if (fileType === 'text/markdown') {
      // For Markdown, preserve structure but clean up
      processedContent = content
        .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers for cleaner chunks
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Convert links to text
    }
    
    // Split text into chunks
    const textChunks = await this.textSplitter.splitText(processedContent)
    
    // Generate embeddings for each chunk in batches to avoid rate limits
    const chunks = []
    const batchSize = 5
    
    for (let i = 0; i < textChunks.length; i += batchSize) {
      const batch = textChunks.slice(i, i + batchSize)
      
      // Process batch
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex
        
        // Add small delay between requests
        if (chunkIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        try {
          const embeddingResponse = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk,
          })
          
          return {
            content: chunk,
            embedding: embeddingResponse.data[0].embedding,
            metadata: {
              page: Math.floor(chunkIndex / 5) + 1, // Rough page estimation
              section: this.extractSection(chunk)
            }
          }
        } catch (error) {
          console.error(`Error processing chunk ${chunkIndex}:`, error)
          throw error
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      chunks.push(...batchResults)
    }
    
    return chunks
  }

  private extractSection(chunk: string): string | undefined {
    // Try to extract a section header from the chunk
    const lines = chunk.split('\n')
    for (const line of lines.slice(0, 3)) { // Check first 3 lines
      const trimmed = line.trim()
      if (trimmed.length > 0 && trimmed.length < 100) {
        // Likely a header if it's short and at the beginning
        if (trimmed.endsWith(':') || /^[A-Z][^.!?]*$/.test(trimmed)) {
          return trimmed
        }
      }
    }
    return undefined
  }

  async classifyMessage(message: string): Promise<'question' | 'statement' | 'other'> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Classify the user message as "question", "statement", or "other". Respond with only one word.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 10,
      temperature: 0
    })

    const classification = response.choices[0]?.message?.content?.toLowerCase().trim()
    
    if (['question', 'statement', 'other'].includes(classification || '')) {
      return classification as 'question' | 'statement' | 'other'
    }
    
    return 'other'
  }

  async generateHypotheticalAnswer(question: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a hypothetical answer to the user\'s question. Keep it concise and relevant.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || question
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    return response.data[0].embedding
  }

  async findSimilarChunks(
    queryEmbedding: number[],
    chunks: DocumentChunk[],
    topK: number = 10
  ): Promise<Array<DocumentChunk & { similarity: number }>> {
    // Calculate similarities
    const chunksWithSimilarity = chunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }))

    // Sort by similarity and return top K
    return chunksWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }

  async generateResponse(
    message: string,
    context: string,
    chatbotSettings?: { welcomeMessage?: string }
  ): Promise<string> {
    const systemPrompt = `You are a helpful customer service assistant for this business. 
    Use the provided context to answer questions accurately and helpfully.
    Keep your responses concise and professional.
    If you don't know something based on the context, say so politely.
    
    ${chatbotSettings?.welcomeMessage ? `Welcome message: ${chatbotSettings.welcomeMessage}` : ''}
    
    Context:
    ${context}`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || 'I apologize, but I cannot provide an answer at this time.'
  }

  async performRAGQuery(
    message: string,
    availableChunks: DocumentChunk[],
    chatbotSettings?: { welcomeMessage?: string }
  ): Promise<{ response: string; retrievedChunks: string[] }> {
    // 1. Classify the message
    const classification = await this.classifyMessage(message)
    
    let queryText = message
    
    // 2. For questions, generate hypothetical answer for better retrieval
    if (classification === 'question') {
      queryText = await this.generateHypotheticalAnswer(message)
    }
    
    // 3. Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(queryText)
    
    // 4. Find similar chunks
    const similarChunks = await this.findSimilarChunks(queryEmbedding, availableChunks, 10)
    
    // 5. Build context from top chunks
    const context = similarChunks
      .map(chunk => chunk.content)
      .join('\n\n')
    
    // 6. Generate response
    const response = await this.generateResponse(message, context, chatbotSettings)
    
    return {
      response,
      retrievedChunks: similarChunks.map(chunk => chunk.id)
    }
  }
}