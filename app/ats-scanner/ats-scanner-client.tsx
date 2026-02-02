"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { ATSResults } from "@/components/ats-results"
import { ATSGuidance } from "@/components/ats-guidance"
import { CoverLetterGenerator } from "@/components/cover-letter-generator"
import { QualityScoreCard } from "@/components/quality-score-card"
import { FileText, Sparkles, Target, CheckCircle, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAtsScan } from "@/hooks/use-ats-scan"
import { PageHeader } from "@/components/page-header"

export default function ATSScannerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState("")
  const [showCoverLetter, setShowCoverLetter] = useState(false)
  const { toast } = useToast()
  const { runScan, loading: isScanning, data: scanData } = useAtsScan()

  // Transform API response to match UI component expectations
  const scanResults = scanData ? {
    traditionalScore: scanData.traditional_score,
    aiScore: scanData.ai_score,
    matchedKeywords: scanData.matched_keywords || [],
    missingKeywords: scanData.missing_keywords.map((kw: string, idx: number) => ({
      keyword: kw,
      importance: (idx < 5 ? "High" : idx < 10 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      reason: idx < 5 ? "Critical keyword from job description" : "Important term to include"
    })),
    qualityIndicators: scanData.quality_indicators || {},
    recommendations: [
      `Your traditional ATS score is ${scanData.traditional_score}%. ${scanData.traditional_score < 70 ? 'Consider adding more relevant keywords.' : 'Good keyword match!'}`,
      `AI semantic score: ${scanData.ai_score}%. ${scanData.ai_score < 70 ? 'Improve content relevance to job description.' : 'Strong semantic alignment!'}`,
      scanData.formatting_penalty > 0 ? `Formatting penalty detected (${scanData.formatting_penalty} points). Simplify resume layout for better ATS compatibility.` : 'Resume formatting is ATS-friendly.',
      (scanData.quality_indicators?.action_verbs_bonus ?? 0) > 0 ? `Great! Found ${(scanData.quality_indicators?.action_verbs_bonus ?? 0) * 2} action verbs (+${scanData.quality_indicators?.action_verbs_bonus} points).` : 'Add more action verbs (achieved, led, implemented, etc.) for stronger impact.',
      (scanData.quality_indicators?.quantifiable_results_bonus ?? 0) > 0 ? `Excellent! Found ${(scanData.quality_indicators?.quantifiable_results_bonus ?? 0) * 3} quantifiable results (+${scanData.quality_indicators?.quantifiable_results_bonus} points).` : 'Include numbers, percentages, and metrics to demonstrate impact.',
      (scanData.quality_indicators?.certifications_found?.length ?? 0) > 0 ? `Certifications detected: ${scanData.quality_indicators?.certifications_found?.join(', ')} (+${scanData.quality_indicators?.certifications_bonus} points).` : 'Add relevant certifications if you have them.',
      scanData.missing_keywords.length > 0 ? `Top missing keywords to add: ${scanData.missing_keywords.slice(0, 5).join(', ')}` : 'All key terms are present!'
    ]
  } : null

  const handleScan = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please upload a resume and provide a job description.",
        variant: "destructive",
      })
      return
    }

    try {
      await runScan(resumeFile, jobDescription)
      toast({
        title: "Scan Complete!",
        description: "Your resume has been analyzed successfully.",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "There was an error analyzing your resume. Please try again."
      toast({
        title: "Scan Failed",
        description: message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-6 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 mb-4">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Resume Analysis</span>
          </div>

          <PageHeader
            title="ATS Resume Scanner"
            description="Get your resume analyzed by our advanced AI system with dual-scoring technology and optimize it for Applicant Tracking Systems"
            titleClassName="text-5xl sm:text-5xl md:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-2"
            descriptionClassName="text-xl sm:text-xl"
          />
        </div>
      </div>

      {/* ATS Guidance - Explain how it works */}
      <ATSGuidance />

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden bg-card/60 backdrop-blur">
            <CardHeader className="border-b border-border bg-gradient-to-r from-muted/60 to-background">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span>Upload Resume</span>
              </CardTitle>
              <CardDescription>Upload your resume in PDF, Word, or text format</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <FileUpload onFileSelect={setResumeFile} acceptedTypes={["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/octet-stream"]} maxSize={10} />
              {resumeFile && (
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">{resumeFile.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Ready for analysis</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden bg-card/60 backdrop-blur">
            <CardHeader className="border-b border-border bg-gradient-to-r from-muted/60 to-background">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span>Job Description</span>
              </CardTitle>
              <CardDescription>Paste the job description you&apos;re targeting</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste the complete job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] rounded-xl"
              />
              {jobDescription.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {jobDescription.split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Coins className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Scan Cost: 2 Credits</p>
                    <p className="text-xs text-muted-foreground">Includes AI analysis & recommendations</p>
                  </div>
                </div>
                <Button
                  onClick={handleScan}
                  disabled={isScanning || !resumeFile || !jobDescription.trim()}
                  size="lg"
                  variant="brand"
                  className="shadow-lg hover:shadow-xl px-8"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start ATS Scan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {isScanning && (
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
              <CardHeader className="border-b border-purple-100 dark:border-purple-900/30 bg-background/60 backdrop-blur">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    Analyzing Your Resume
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {[
                  { label: "Processing document", value: 100 },
                  { label: "Analyzing keywords", value: 75 },
                  { label: "Generating recommendations", value: 45 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">{item.label}...</span>
                      <span className="text-purple-600 dark:text-purple-400">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!isScanning && !scanResults && (
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-muted/40 to-background">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Upload your resume and paste a job description to get started with your ATS compatibility analysis.
                </p>
              </CardContent>
            </Card>
          )}

          {scanResults && (
            <div className="space-y-6">
              <ATSResults results={scanResults} />
              
              {scanData?.warnings?.length ? (
                <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Warnings</p>
                        <ul className="space-y-1">
                          {scanData.warnings.map((w: string, i: number) => (
                            <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              
              <QualityScoreCard qualityIndicators={scanResults.qualityIndicators} />
              
              <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Generate Cover Letter</p>
                        <p className="text-xs text-muted-foreground">AI-crafted to match your resume & job</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowCoverLetter(true)} 
                      variant="outline" 
                      size="lg"
                      className="border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-6"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                      Generate (3 Credits)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showCoverLetter && (
        <CoverLetterGenerator
          resumeFile={resumeFile}
          jobDescription={jobDescription}
          onClose={() => setShowCoverLetter(false)}
        />
      )}
    </div>
  )
}
