"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Star, Mic, Mail, BarChart3, ClipboardCheck, Building2 } from "lucide-react"
import { StarStoryBank } from "@/components/career-tools/star-story-bank"
import { ElevatorPitchGenerator } from "@/components/career-tools/elevator-pitch-generator"
import { NetworkingEmailGenerator } from "@/components/career-tools/networking-email-generator"
import { OfferComparisonTool } from "@/components/career-tools/offer-comparison-tool"
import { InterviewChecklist } from "@/components/career-tools/interview-checklist"
import { CompanyResearchAssistant } from "@/components/career-tools/company-research-assistant"

const tools = [
  { id: "star", label: "STAR Stories", icon: Star, color: "text-amber-600" },
  { id: "pitch", label: "Elevator Pitch", icon: Mic, color: "text-rose-600" },
  { id: "email", label: "Networking Emails", icon: Mail, color: "text-sky-600" },
  { id: "compare", label: "Offer Compare", icon: BarChart3, color: "text-emerald-600" },
  { id: "checklist", label: "Interview Prep", icon: ClipboardCheck, color: "text-violet-600" },
  { id: "research", label: "Company Intel", icon: Building2, color: "text-orange-600" },
]

export default function CareerToolsClient() {
  const [activeTab, setActiveTab] = useState("star")

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="AI Career Toolkit"
        description="Your complete career advancement toolkit — from crafting STAR stories to researching companies and comparing offers."
        titleClassName="bg-gradient-to-r from-amber-600 via-rose-600 to-violet-600 bg-clip-text text-transparent"
      />

      {/* Tool Selector - Mobile-friendly grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTab === tool.id
          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                isActive
                  ? "ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/5 to-primary/10"
                  : "hover:bg-muted/30"
              }`}
              onClick={() => setActiveTab(tool.id)}
            >
              <CardContent className="pt-4 pb-3 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? tool.color : "text-muted-foreground"}`} />
                <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{tool.label}</p>
                {isActive && <div className="w-8 h-0.5 bg-primary mx-auto mt-2 rounded-full" />}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tool Content */}
      <div className="min-h-[600px]">
        {activeTab === "star" && <StarStoryBank />}
        {activeTab === "pitch" && <ElevatorPitchGenerator />}
        {activeTab === "email" && <NetworkingEmailGenerator />}
        {activeTab === "compare" && <OfferComparisonTool />}
        {activeTab === "checklist" && <InterviewChecklist />}
        {activeTab === "research" && <CompanyResearchAssistant />}
      </div>
    </div>
  )
}
