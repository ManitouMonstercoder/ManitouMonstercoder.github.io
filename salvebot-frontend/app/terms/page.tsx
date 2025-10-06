import { Button } from '@/components/ui/button'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <ShieldIcon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">Salvebot</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="btn-hover">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
          
          <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service ("Terms") govern your use of Salvebot's AI chatbot platform and services 
              provided by Salvebot Inc. By accessing or using our services, you agree to be bound by these Terms.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">1. Acceptance of Terms</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                By creating an account, accessing our platform, or using our services, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms. If you disagree with any part of these terms, 
                you may not access or use our services.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">2. Service Description</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Salvebot provides an AI-powered chatbot platform that allows businesses to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Create and deploy intelligent chatbots using RAG technology</li>
                <li>Upload and manage documents for AI training</li>
                <li>Customize chatbot appearance and behavior</li>
                <li>Integrate chatbots into websites and applications</li>
                <li>Monitor analytics and performance metrics</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">3. User Accounts</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Account Registration</h4>
                  <p>You must provide accurate, complete, and current information when creating an account.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Account Security</h4>
                  <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Account Termination</h4>
                  <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">4. Acceptable Use</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use our services to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Distribute malicious or harmful content</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Attempt to compromise system security</li>
                <li>Spam or harass other users</li>
                <li>Use the service for illegal or unethical purposes</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">5. Subscription Plans and Payments</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Subscription Fees</h4>
                  <p>Paid subscriptions are billed in advance on a monthly or annual basis.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Payment Methods</h4>
                  <p>We accept payment through Stripe and other authorized payment processors.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Refunds</h4>
                  <p>Refunds are handled on a case-by-case basis within our refund policy.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Plan Changes</h4>
                  <p>You can upgrade or downgrade your subscription plan at any time.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">6. Intellectual Property</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Our Rights</h4>
                  <p>Salvebot retains all rights to the platform, technology, and intellectual property.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Your Content</h4>
                  <p>You retain ownership of content you upload, but grant us license to use it for service delivery.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Prohibited Use</h4>
                  <p>You may not copy, modify, or redistribute our proprietary technology.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">7. Privacy and Data Protection</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of your data is governed 
                by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">8. Service Availability</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Uptime</h4>
                  <p>We strive to maintain high service availability but cannot guarantee 100% uptime.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Maintenance</h4>
                  <p>We may perform scheduled maintenance with reasonable notice when possible.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Service Changes</h4>
                  <p>We reserve the right to modify or discontinue services with appropriate notice.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">9. Limitation of Liability</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Services are provided "as is" without warranties of any kind</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid for services</li>
                <li>Some jurisdictions may not allow these limitations</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">10. Termination</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">By You</h4>
                  <p>You may terminate your account at any time through your account settings.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">By Us</h4>
                  <p>We may terminate access for violations of these Terms or at our discretion.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Effect of Termination</h4>
                  <p>Upon termination, your right to use the services ceases immediately.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">11. Governing Law</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of the State of California, 
                United States, without regard to conflict of law principles.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">12. Changes to Terms</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you of significant changes 
                via email or in-app notifications. Continued use of our services constitutes acceptance 
                of the updated Terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">13. Contact Information</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> legal@salvebot.com</p>
                <p><strong>Address:</strong> Salvebot Inc., 123 Tech Street, San Francisco, CA 94105</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>

          <div className="bg-card p-6 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              These Terms of Service constitute the entire agreement between you and Salvebot Inc. 
              regarding the use of our AI chatbot platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
