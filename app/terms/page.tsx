import { PageHeader } from "@/components/page-header"

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader title="Terms of Service" description="Last updated: January 15, 2024" />

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using CareerBoost AI, you accept and agree to be bound by the terms and provision of this
          agreement.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          CareerBoost AI provides AI-powered resume analysis, interview practice, and career development tools. Our
          services include:
        </p>
        <ul>
          <li>ATS resume scanning and optimization</li>
          <li>AI-generated cover letters</li>
          <li>Technical and behavioral interview practice</li>
          <li>Personalized feedback and recommendations</li>
        </ul>

        <h2>3. User Accounts and Credits</h2>
        <p>
          Users must create an account to access our services. Our platform operates on a credit-based system where
          different features consume different amounts of credits.
        </p>

        <h2>4. Payment and Subscriptions</h2>
        <p>
          Subscription fees are billed monthly and are non-refundable. Users may cancel their subscription at any time,
          with access continuing until the end of the current billing period.
        </p>

        <h2>5. Privacy and Data Protection</h2>
        <p>
          We are committed to protecting your privacy. Please review our Privacy Policy to understand how we collect,
          use, and protect your information.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content, features, and functionality of CareerBoost AI are owned by us and are protected by copyright,
          trademark, and other intellectual property laws.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          CareerBoost AI provides tools and recommendations but does not guarantee job placement or interview success.
          Users are responsible for their own career decisions.
        </p>

        <h2>8. Contact Information</h2>
        <p>For questions about these Terms of Service, please contact us at legal@careerboost.ai</p>
      </div>
    </div>
  )
}
