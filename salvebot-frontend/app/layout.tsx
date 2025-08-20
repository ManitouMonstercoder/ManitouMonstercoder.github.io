import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Salvebot - AI Chatbot for Your Business',
  description: 'Create intelligent chatbots for your website using RAG technology. Upload your business documents and let AI answer customer questions.',
  keywords: 'chatbot, AI, customer service, RAG, business automation',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Salvebot - AI Chatbot for Your Business',
    description: 'Create intelligent chatbots for your website using RAG technology',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Salvebot',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Salvebot - AI Chatbot for Your Business',
    description: 'Create intelligent chatbots for your website using RAG technology',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}