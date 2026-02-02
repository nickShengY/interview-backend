import { PageHeader } from "@/components/page-header"

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader title="Privacy Policy" description="Last updated: January 15, 2024" />

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create an account, upload resumes, or use
          our services.
        </p>

        <h3>Personal Information</h3>
        <ul>
          <li>Name and email address</li>
          <li>Profile information (MBTI type, zodiac sign)</li>
          <li>Resume and career-related documents</li>
          <li>Interview responses and practice sessions</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and improve our AI-powered services</li>
          <li>Personalize your experience and recommendations</li>
          <li>Process payments and manage subscriptions</li>
          <li>Communicate with you about our services</li>
        </ul>

        <h2>3. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information against unauthorized access,
          alteration, disclosure, or destruction.
        </p>

        <h2>4. Voice Recordings</h2>
        <p>
          Voice recordings from interview practice sessions are processed for transcription purposes only and are not
          stored permanently on our servers.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          We may use third-party AI services to provide our features. These services are bound by their own privacy
          policies and our data processing agreements.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is active or as needed to provide services.
          You may request deletion of your data at any time.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information. You may also opt out of certain
          communications from us.
        </p>

        <h2>8. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at privacy@careerboost.ai</p>
      </div>
    </div>
  )
}
