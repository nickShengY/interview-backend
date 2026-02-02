"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useAtsScan } from "@/hooks/use-ats-scan"
import { useCoverLetter } from "@/hooks/use-cover-letter"
import { AtsResult } from "@/components/ats-result"
import { toast } from "sonner"

export default function AtsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jd, setJd] = useState<string>("")
  const { runScan, loading, data } = useAtsScan()
  const { generate, loading: coverLoading, cover } = useCoverLetter()

  const handleScan = async () => {
    if (!file) {
      toast.error("Please upload a resume file")
      return
    }
    if (!jd.trim()) {
      toast.error("Please paste the job description")
      return
    }
    try {
      await runScan(file, jd)
    } catch {
      toast.error("Scan failed")
    }
  }

  const handleCover = async () => {
    if (!file || !jd.trim()) {
      toast.error("Upload resume and paste JD first")
      return
    }
    try {
      await generate(file!, jd)
    } catch {
      toast.error("Cover letter generation failed")
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">ATS Resume Scan</h1>

      <FileUpload onFileSelect={setFile} acceptedTypes={["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]} maxSize={5} />

      <div>
        <label className="block font-medium mb-2">Job Description</label>
        <Textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={8} placeholder="Paste the JD here..." />
      </div>

      <Button disabled={loading} onClick={handleScan} className="mr-3">
        {loading ? "Scanning..." : "Run Scan (-2 credits)"}
      </Button>
      <Button disabled={coverLoading} variant="secondary" onClick={handleCover}>
        {coverLoading ? "Generating..." : "Generate Cover Letter (-3 credits)"}
      </Button>

      {data && (
        <AtsResult
          traditional={data.traditional_score}
          ai={data.ai_score}
          penalty={data.formatting_penalty}
          missing={data.missing_keywords}
        />
      )}

      {cover && (
        <div className="p-4 border rounded-lg mt-6 prose max-w-none">
          <h3 className="font-semibold mb-2">Generated Cover Letter</h3>
          <pre className="whitespace-pre-wrap">{cover}</pre>
        </div>
      )}
    </div>
  )
}
