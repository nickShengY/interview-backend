export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 prose prose-gray dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using this ATS & Interview Practice application, you accept and agree to be bound by the terms and provision of this agreement.</p>
      
      <h2>2. Use License</h2>
      <p>Permission is granted to temporarily use this application for personal, non-commercial interview preparation purposes. This is the grant of a license, not a transfer of title.</p>
      
      <h2>3. Credit System</h2>
      <p>Our application uses a credit-based system. Credits are consumed for various features including ATS scans, cover letter generation, and interview questions. Credits are non-refundable once used.</p>
      
      <h2>4. User Data</h2>
      <p>You are responsible for maintaining the confidentiality of your account. We reserve the right to terminate accounts that violate these terms.</p>
      
      <h2>5. Disclaimer</h2>
      <p>The materials on this application are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
      
      <h2>6. Limitations</h2>
      <p>In no event shall our company be liable for any damages arising out of the use or inability to use the materials on this application.</p>
      
      <h2>7. Contact Information</h2>
      <p>If you have any questions about these Terms of Service, please contact us through our support channels.</p>
    </div>
  )
}
