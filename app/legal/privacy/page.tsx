export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 prose prose-gray dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as when you create an account, upload resumes, or use our interview practice features.</p>
      
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain our service</li>
        <li>To process ATS scans and generate personalized feedback</li>
        <li>To create AI-powered cover letters and interview questions</li>
        <li>To process payments and manage your credit balance</li>
      </ul>
      
      <h2>3. Information Sharing</h2>
      <p>We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy. We may share information with service providers who assist us in operating our application.</p>
      
      <h2>4. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
      
      <h2>5. Voice Recordings</h2>
      <p>Voice recordings used in behavioral interview practice are processed in real-time and are not stored on our servers for privacy protection.</p>
      
      <h2>6. Cookies</h2>
      <p>We use cookies to enhance your experience and maintain your session. You can choose to disable cookies through your browser settings.</p>
      
      <h2>7. Changes to Privacy Policy</h2>
      <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
      
      <h2>8. Contact Us</h2>
      <p>If you have questions about this privacy policy, please contact us through our support channels.</p>
    </div>
  )
}
