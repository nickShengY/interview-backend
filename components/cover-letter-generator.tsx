"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Sparkles, Copy, Download, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/auth-fetch"

interface CoverLetterGeneratorProps {
  resumeFile: File | null
  jobDescription: string
  onClose: () => void
}

export function CoverLetterGenerator({ resumeFile, jobDescription, onClose }: CoverLetterGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const { toast } = useToast()

  const generateCoverLetter = async () => {
    if (!resumeFile) {
      toast({
        title: "No Resume File",
        description: "Please upload a resume file first.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jd", jobDescription)

      const jdSig = `${jobDescription.length}:${jobDescription.length ? jobDescription.charCodeAt(0) : 0}:${jobDescription.length ? jobDescription.charCodeAt(jobDescription.length - 1) : 0}`

      const res = await authFetch("/api/ats/cover-letter", {
        method: "POST",
        body: formData,
        dedupeKey: `credits:/api/ats/cover-letter:${resumeFile.name}:${resumeFile.size}:${resumeFile.lastModified}:${jdSig}`,
      })

      if (!res.ok) {
        const errorText = await res.text()
        try {
          const parsed = JSON.parse(errorText)
          throw new Error(parsed?.error || "Failed to generate cover letter")
        } catch {
          throw new Error(errorText || "Failed to generate cover letter")
        }
      }

      const data = await res.json()
      setCoverLetter(data.cover_letter)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('credits:update'))
      }
      
      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter is ready.",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate cover letter. Please try again."
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter)
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard.",
    })
  }

  const downloadAsText = () => {
    const element = document.createElement("a")
    const file = new Blob([coverLetter], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "cover-letter.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Downloaded!",
      description: "Cover letter saved as text file.",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>AI Cover Letter Generator</span>
              </CardTitle>
              <CardDescription>
                Generate a personalized cover letter based on your resume and the job description
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!coverLetter ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Generation Details</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center justify-between">
                    <span>Resume File:</span>
                    <Badge variant="secondary">{resumeFile?.name || "No file"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Job Description:</span>
                    <Badge variant="secondary">{jobDescription.length} characters</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cost:</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      <Coins className="w-3 h-3 mr-1" />3 Credits
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={generateCoverLetter}
                  disabled={isGenerating}
                  variant="brand"
                  className="from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Cover Letter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-3">
                  <div className="text-center text-sm text-muted-foreground">
                    AI is analyzing your resume and job requirements...
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Generated Cover Letter</h3>
                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={downloadAsText} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <Textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="min-h-[400px] bg-background border-0 resize-none"
                    placeholder="Your cover letter will appear here..."
                  />
                </CardContent>
              </Card>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">✨ AI Enhancements Applied</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Matched key skills from job description</li>
                  <li>• Highlighted relevant experience from your resume</li>
                  <li>• Optimized for ATS keyword matching</li>
                  <li>• Personalized tone and structure</li>
                  <li>• Industry-specific language and terminology</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
