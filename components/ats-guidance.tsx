"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Brain, Target, Zap, Sparkles } from "lucide-react"

export function ATSGuidance() {
  return (
    <div className="space-y-6">
      {/* Industry-Grade Alert */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]">
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Industry-Grade ATS Technology</p>
              <p className="text-sm text-muted-foreground">
                Our scanner replicates what Fortune 500 companies use — combining traditional keyword matching with AI semantic understanding (BERT/GPT-style embeddings).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-lg overflow-hidden bg-card/60 backdrop-blur">
        <CardHeader className="border-b border-border bg-gradient-to-r from-muted/60 to-background">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span>How Real ATS Systems Work</span>
          </CardTitle>
          <CardDescription>Understanding the two-phase evaluation process</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditional Score */}
            <div className="group p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Traditional ATS Score</h3>
                  <p className="text-xs text-muted-foreground">Keyword & format analysis</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Keyword Matching:</strong> Uses TF-IDF algorithm (industry standard)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Format Check:</strong> Penalizes complex layouts (tables, multi-column)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Exact Match:</strong> Looks for specific terms from job description</span>
                </li>
              </ul>
              <Badge className="mt-4 bg-background/70 dark:bg-background/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                Used by: Taleo, iCIMS, Greenhouse
              </Badge>
            </div>

            {/* AI Semantic Score */}
            <div className="group p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI Semantic Score</h3>
                  <p className="text-xs text-muted-foreground">Deep learning analysis</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Contextual Understanding:</strong> Uses Google Gemini embeddings</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Semantic Matching:</strong> Understands synonyms and related concepts</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <span><strong className="text-foreground">Intent Analysis:</strong> Evaluates overall fit beyond exact terms</span>
                </li>
              </ul>
              <Badge className="mt-4 bg-background/70 dark:bg-background/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                Used by: LinkedIn, Indeed, Modern ATS
              </Badge>
            </div>
          </div>

          {/* What You'll Get */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">What You&apos;ll Receive</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Dual Scores", desc: "Both traditional and AI-powered ratings" },
                { title: "Missing Keywords", desc: "Top 30 terms to add from JD" },
                { title: "Format Analysis", desc: "Warnings about ATS-unfriendly layouts" },
                { title: "AI Recommendations", desc: "Personalized improvement tips" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-emerald-100 dark:border-emerald-800/30">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">{item.title}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-100 dark:border-amber-800/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground">Pro Tips for 90%+ ATS Score</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {[
                "Use simple formats: Single column, standard fonts (Arial, Calibri)",
                "Include exact keywords from job description naturally in context",
                "Use standard section headings: \"Work Experience\", \"Education\", \"Skills\"",
                "Avoid headers/footers, images, tables, and text boxes",
                "Save as .docx or .pdf (not scanned images)",
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{idx + 1}</span>
                  </div>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
