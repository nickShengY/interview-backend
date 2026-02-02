import { PageHeader } from "@/components/page-header"

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader title="Disclaimer" description="Important information about our services" />

      <div className="prose prose-lg max-w-none">
        <h2>General Disclaimer</h2>
        <p>
          The information and services provided by CareerBoost AI are for educational and informational purposes only.
          While we strive to provide accurate and helpful career guidance, we make no guarantees about employment
          outcomes.
        </p>

        <h2>AI-Generated Content</h2>
        <p>
          Our platform uses artificial intelligence to generate recommendations, cover letters, and feedback. While our
          AI is trained on extensive data, the output should be reviewed and customized by users before use in actual
          job applications.
        </p>

        <h2>ATS Scoring</h2>
        <p>
          Our ATS scoring system provides estimates based on common applicant tracking system criteria. Actual ATS
          systems may vary significantly between companies, and our scores should be used as general guidance only.
        </p>

        <h2>Interview Practice</h2>
        <p>
          Interview practice sessions are designed to help users prepare, but actual interview experiences may differ
          significantly. Success in interviews depends on many factors beyond preparation.
        </p>

        <h2>No Employment Guarantee</h2>
        <p>
          CareerBoost AI does not guarantee job placement, interview success, or any specific career outcomes. Users are
          responsible for their own career decisions and job search activities.
        </p>

        <h2>Professional Advice</h2>
        <p>
          Our services do not constitute professional career counseling or legal advice. For specific career guidance,
          consider consulting with qualified career professionals.
        </p>

        <h2>Accuracy of Information</h2>
        <p>
          While we strive for accuracy, we cannot guarantee that all information provided through our platform is
          complete, accurate, or up-to-date. Users should verify important information independently.
        </p>

        <h2>Third-Party Content</h2>
        <p>
          Our platform may include links to third-party websites or services. We are not responsible for the content,
          privacy policies, or practices of these external sites.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          CareerBoost AI, its employees, and affiliates shall not be liable for any direct, indirect, incidental, or
          consequential damages arising from the use of our services.
        </p>

        <h2>Updates to Disclaimer</h2>
        <p>
          We may update this disclaimer from time to time. Continued use of our services constitutes acceptance of any
          changes.
        </p>
      </div>
    </div>
  )
}
