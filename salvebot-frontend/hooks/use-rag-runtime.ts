import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

interface UseRAGRuntimeProps {
  chatbotId: string;
  domain: string;
  sessionId?: string;
}

export function useRAGRuntime({ chatbotId, domain, sessionId }: UseRAGRuntimeProps) {
  // The useChatRuntime hook from AI SDK uses the default /api/chat endpoint
  // We'll pass our additional parameters via headers or query params
  const runtime = useChatRuntime();

  return runtime;
}

export type RAGRuntime = ReturnType<typeof useRAGRuntime>;