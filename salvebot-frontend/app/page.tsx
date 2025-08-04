'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BotIcon, ZapIcon, ShieldIcon, ArrowRightIcon, SparklesIcon, CheckCircle2Icon } from '@/components/icons'
import { authUtils } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (authUtils.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [])
  
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <BotIcon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">Salvebot</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Docs
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Link href="/signin">
              <Button variant="ghost" size="sm" className="btn-hover">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="btn-hover shadow-lg flex items-center space-x-2">
                <span>Get Started</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-brand/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-6 text-center relative">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8 animate-fade-in">
            <SparklesIcon className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">AI-Powered Customer Support</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold mb-8 max-w-4xl mx-auto leading-tight animate-fade-in">
            Transform Customer Support with{' '}
            <span className="bg-gradient-to-r from-primary via-brand to-primary bg-clip-text text-transparent">
              AI Chatbots
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Upload your business documents and create intelligent chatbots that understand your content. 
            Deliver instant, accurate customer support 24/7.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link href="/signup">
              <Button size="lg" className="btn-hover shadow-lg px-8 py-4 text-base flex items-center space-x-2">
                <span>Start Free Trial</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="btn-hover px-8 py-4 text-base">
                View Demo
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 text-sm text-muted-foreground animate-fade-in">
            <p>No credit card required • Setup in 5 minutes • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything you need to create{' '}
              <span className="text-primary">smart chatbots</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful features designed to make AI chatbot creation simple and effective
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center p-8 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BotIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Smart RAG Technology</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload PDFs, documents, or knowledge bases. Our AI understands context and provides accurate, relevant answers to customer questions.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                Domain verification, secure authentication, and data protection ensure your chatbot works only on authorized websites.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card/50">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ZapIcon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">One-Click Integration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Simple embed code works with any website or platform. Deploy in minutes, customize appearance, and start helping customers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Simple, transparent{' '}
              <span className="text-primary">pricing</span>  
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free, scale as you grow. No hidden fees or surprise charges.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-10 rounded-3xl border border-border/50 card-shadow hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6">Perfect for small businesses and startups</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">$9</span>
                  <span className="text-xl text-muted-foreground ml-2">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>1 intelligent chatbot</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>100 conversations per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Upload up to 10 documents</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Domain verification</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              
              <Link href="/signup?plan=starter">
                <Button className="w-full btn-hover py-4 text-base">
                  Get Started
                </Button>
              </Link>
            </div>
            
            <div className="bg-card p-10 rounded-3xl border-2 border-primary card-shadow-lg hover:shadow-xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-brand text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6">Ideal for growing businesses with higher volume</p>
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold">$29</span>
                  <span className="text-xl text-muted-foreground ml-2">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>5 intelligent chatbots</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>1,000 conversations per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Unlimited document uploads</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span>Custom branding</span>
                </li>
              </ul>
              
              <Link href="/signup?plan=pro">
                <Button className="w-full btn-hover py-4 text-base bg-gradient-to-r from-primary to-brand hover:from-primary/90 hover:to-brand/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <BotIcon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-semibold">Salvebot</span>
              </Link>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                Open-source AI chatbot platform for businesses. Create intelligent customer support bots in minutes with advanced RAG technology.
              </p>
              <div className="flex space-x-2">
                <Link href="/signup">
                  <Button size="sm">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="https://github.com/salvebot/salvebot">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <span>GitHub</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-foreground">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/integrations" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-foreground">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">Community</Link></li>
                <li><Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              <p>&copy; 2024 Salvebot. Open source and free to use.</p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}