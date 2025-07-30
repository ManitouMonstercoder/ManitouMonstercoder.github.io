export class ChatSession {
  private state: DurableObjectState
  private env: any

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
  }

  // Handle HTTP requests to this Durable Object
  async fetch(request: Request): Promise<Response> {
    return new Response('ChatSession Durable Object - Not implemented yet', { status: 501 })
  }
}