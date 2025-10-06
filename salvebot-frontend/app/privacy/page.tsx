import { Button } from '@/components/ui/button'
import { ShieldIcon, ArrowLeftIcon } from '@/components/icons'
import Link from 'next/link'

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          
          <div className="bg-card p-8 rounded-2xl border border-border/50 card-shadow mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              At Salvebot Inc., we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, share, and protect your information when you use our AI chatbot platform.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Information We Collect</h2>
            
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Account Information</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Name and email address</li>
                  <li>Company name and billing information</li>
                  <li>Authentication credentials</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Usage Data</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Chatbot interactions and conversations</li>
                  <li>Uploaded documents and content</li>
                  <li>Analytics and performance metrics</li>
                  <li>IP address and device information</li>
                </ul>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border/50">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Technical Data</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent</li>
                  <li>Referral sources</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">How We Use Your Information</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li><strong>Service Delivery:</strong> To provide and maintain our AI chatbot services</li>
                <li><strong>Personalization:</strong> To customize your experience and improve chatbot performance</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and optimize our platform</li>
                <li><strong>Security:</strong> To protect against fraud and ensure service security</li>
                <li><strong>Communication:</strong> To send important updates and support messages</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Data Security and Protection</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using AES-256 encryption</li>
                <li><strong>Access Control:</strong> Strict access controls and authentication mechanisms</li>
                <li><strong>Regular Audits:</strong> Security audits and vulnerability assessments</li>
                <li><strong>Compliance:</strong> GDPR, CCPA, and other privacy regulation compliance</li>
                <li><strong>Data Minimization:</strong> We collect only necessary information for service delivery</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Your Rights and Choices</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Obtain a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Opt-out of marketing communications</li>
                <li><strong>Restriction:</strong> Limit processing of your information</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Data Retention</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only as long as necessary to provide our services and comply with legal obligations. 
                You can request deletion of your account and associated data at any time through your account settings or by contacting our support team.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Third-Party Services</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use trusted third-party services to operate our platform:
              </p>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li><strong>OpenAI:</strong> For AI model processing and embeddings</li>
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Cloudflare:</strong> For CDN and security services</li>
                <li><strong>Google Analytics:</strong> For website analytics (with anonymized data)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These services are bound by their own privacy policies and data protection agreements.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">International Data Transfers</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure adequate protection through standard contractual clauses and other legal mechanisms 
                in accordance with GDPR requirements.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Changes to This Policy</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new policy on this page and updating the "Last Updated" date. 
                Significant changes will be communicated via email or in-app notifications.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Contact Us</h2>
            
            <div className="bg-card p-6 rounded-xl border border-border/50">
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or want to exercise your rights, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> privacy@salvebot.com</p>
                <p><strong>Address:</strong> Salvebot Inc., 123 Tech Street, San Francisco, CA 94105</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>

          <div className="bg-card p-6 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              This Privacy Policy is part of our commitment to transparency and user privacy. 
              By using Salvebot, you agree to the collection and use of information as described in this policy.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
