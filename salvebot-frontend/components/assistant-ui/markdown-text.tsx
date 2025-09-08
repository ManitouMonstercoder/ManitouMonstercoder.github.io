import * as React from "react";

interface MarkdownTextProps {
  children: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ children }) => {
  // Simple markdown parsing - in production you'd use a proper markdown library
  const processText = (text: string) => {
    // Handle basic markdown: bold, italic, code blocks, line breaks
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processText(children) }}
    />
  );
};