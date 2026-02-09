import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Users, Sparkles, Zap, Star, TrendingUp, BookOpen, Brain, Target, DollarSign, Linkedin, Map, Wrench, Flame, Mail, BarChart3, ClipboardCheck, Building2, Mic } from "lucide-react"

import { FAQSection } from "@/components/faq-section"

export default function HomePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the AI ATS Scanner improve my resume score?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our ATS Scanner uses dual-layer analysis: traditional keyword matching and AI-powered semantic scoring. It identifies missing critical keywords, formatting issues that confuse ATS parsers, and impact gaps."
        }
      },
      {
        "@type": "Question",
        "name": "Can I practice for specific technical roles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our Technical Interview Practice covers 50+ roles including Software Engineering, Data Science, Product Management, and System Design. You can select your industry, specific job title, and focus area to get tailored questions."
        }
      },
      {
        "@type": "Question",
        "name": "What is the \"Textbook Learning\" feature?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Textbook Learning is our SOTA accelerated learning engine. You upload any PDF textbook, and our AI converts it into a structured 6-12 week study plan with summaries, flashcards, and quizzes."
        }
      },
      {
        "@type": "Question",
        "name": "How does the Behavioral Interview practice work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We use the STAR method framework to coach you. The AI analyzes your spoken or written answers for clarity, impact, and empathy, personalized to your MBTI personality type."
        }
      },
      {
        "@type": "Question",
        "name": "Is the service free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer a generous free tier that includes basic ATS scanning and limited interview practice credits. Pro and Ultra plans offer increased limits and advanced features."
        }
      }
    ]
  }

  return (
    <div className="space-y-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Hero Section */}
      <section className="text-center space-y-8 py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-700 animate-bounce">
            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Career Advancement</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient leading-tight">
            Get Hired Faster.
            <br />
            <span className="relative">
              Master New Fields in 6–12 Weeks
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Interview Pro combines a production-grade ATS scanner, intelligent technical/behavioral practice, and a
            state‑of‑the‑art textbook learning system so you can switch roles or level up rapidly—often in just 6 or 12 weeks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/ats-scanner">
              <Button
                size="hero"
                variant="brand"
                className="shadow-2xl hover:shadow-3xl transform hover:scale-105 duration-300 animate-pulse-glow"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Scan
              </Button>
            </Link>
            <Link href="/technical-interview">
              <Button
                size="hero"
                variant="outline"
                className="border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transform hover:scale-105 transition-all duration-300 bg-transparent"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Practice Interview
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>10k+ Success Stories</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span>6–12 Week Mastery Tracks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors duration-300">
              ATS Scanner
            </CardTitle>
            <CardDescription className="text-base">
              Advanced AI-powered resume analysis with dual scoring system and intelligent optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <span>Dual ATS scoring system</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <span>AI-generated cover letters</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <span>Smart keyword optimization</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl group-hover:text-purple-600 transition-colors duration-300">
              Technical Practice
            </CardTitle>
            <CardDescription className="text-base">
              Industry-specific coding questions with AI feedback and gamified credit rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                <span>Industry-specific questions</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <span>Gamified spin wheel rewards</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <span>Voice & text input support</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl group-hover:text-pink-600 transition-colors duration-300">
              Behavioral Practice
            </CardTitle>
            <CardDescription className="text-base">
              MBTI-personalized questions with breathing exercises and voice analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
                <span>MBTI-based personalization</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <span>Guided breathing exercises</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <span>Voice recording & playback</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl group-hover:text-orange-600 transition-colors duration-300">
              Textbook Learning (SOTA)
            </CardTitle>
            <CardDescription className="text-base">
              State‑of‑the‑art accelerated learning to master new fields in 6–12 weeks with AI‑generated study plans
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full animate-pulse"></div>
                <span>AI-generated study plans & flashcards</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <span>Active recall + spaced repetition engine</span>
              </li>
              <li className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <span>6–12 week mastery tracks with adaptive quizzes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* New: Career Advancement Tools */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm px-3 py-1">New Career Tools</Badge>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Complete Career Advancement Suite
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            From salary negotiation to company research — every tool you need to land your dream job and maximize your offer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, title: "Salary Negotiation Coach", desc: "AI-powered scripts, market data, and counter-offer strategies to maximize your compensation.", href: "/salary-negotiation", gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" },
            { icon: Linkedin, title: "LinkedIn Optimizer", desc: "Get your profile scored and optimized with keyword analysis, headline rewrites, and content ideas.", href: "/linkedin-optimizer", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20" },
            { icon: Map, title: "Career Roadmap Planner", desc: "Personalized career transition plans with skill gap analysis, certifications, and salary projections.", href: "/career-roadmap", gradient: "from-violet-500 to-indigo-500", bg: "from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20" },
            { icon: Flame, title: "Daily Interview Challenge", desc: "One question a day with streak tracking, achievement badges, and a 30-day heatmap calendar.", href: "/daily-challenge", gradient: "from-orange-500 to-red-500", bg: "from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20" },
            { icon: Building2, title: "Company Research Intel", desc: "AI-powered company culture analysis, interview process breakdown, and smart questions to ask.", href: "/career-tools", gradient: "from-amber-500 to-orange-500", bg: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20" },
            { icon: Wrench, title: "Career Toolkit", desc: "STAR Story Bank, Elevator Pitch Generator, Networking Emails, Offer Comparison, and Interview Checklist.", href: "/career-tools", gradient: "from-rose-500 to-pink-500", bg: "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20" },
          ].map((tool, i) => {
            const Icon = tool.icon
            return (
              <Link key={i} href={tool.href}>
                <Card className={`group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br ${tool.bg} overflow-hidden relative h-full`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/10 transition-all duration-500" />
                  <CardHeader className="relative z-10">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tool.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">{tool.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl p-12 md:p-16 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/10 dark:to-pink-900/10 border border-orange-200/60 dark:border-orange-800/40 space-y-8">
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm px-3 py-1">SOTA Textbook Learning</Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-300">
            Learn a New Field in 6–12 Weeks
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Our accelerated program blends AI‑generated study plans, chapter summaries, active recall flashcards,
            spaced repetition, and adaptive quizzes. Whether you choose a focused 6‑week sprint or a deeper 12‑week track,
            you’ll build durable knowledge quickly and confidently.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/textbook-learning?track=6">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 px-8 py-6 text-lg rounded-full">
              Start 6‑Week Track
            </Button>
          </Link>
          <Link href="/textbook-learning?track=12">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-full border-2">
              Explore 12‑Week Track
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[{icon: Brain, title: 'AI Study Plans', desc: 'Daily schedule with goals, summaries, and checkpoints.'},
            {icon: Target, title: 'Active Recall', desc: 'Flashcards and quizzes that cement long‑term memory.'},
            {icon: BookOpen, title: 'Chapter Intelligence', desc: 'Auto‑generated highlights and key points for fast reviews.'}].map((f, i) => {
              const Icon = f.icon
              return (
                <Card key={i} className="border-0 bg-white/70 dark:bg-white/5 backdrop-blur">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
        </div>
      </section>

      <FAQSection />

      {/* Pricing Section */}
      <section className="text-center space-y-12 py-16">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Success Plan
          </h2>
          <p className="text-xl text-muted-foreground">
            Unlock your career potential with our AI-powered tools
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="relative overflow-hidden border-2 border-border hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"></div>
            <CardHeader className="relative z-10 text-center pb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 mx-auto">
                <Star className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Pro Plan</CardTitle>
              <CardDescription className="text-lg">Perfect for job seekers</CardDescription>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-green-600">
                  $7.99
                  <span className="text-2xl text-muted-foreground line-through ml-2">$11.99</span>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm px-3 py-1">
                  33% OFF Limited Time
                </Badge>
                <p className="text-muted-foreground">/month</p>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <ul className="space-y-4 text-left">
                {[
                  "100 Credits per month",
                  "All ATS scanning features",
                  "Technical interview practice",
                  "Behavioral interview coaching",
                  "AI cover letter generation",
                  "Email support",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div
                      className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    ></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-purple-500 hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 text-sm font-bold rounded-bl-lg">
              POPULAR
            </div>
            <CardHeader className="relative z-10 text-center pb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
              </div>
              <CardTitle className="text-3xl font-bold text-purple-600">Ultra Plan</CardTitle>
              <CardDescription className="text-lg">For serious career advancement</CardDescription>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-purple-600">$27.99</div>
                <p className="text-muted-foreground">/month</p>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <ul className="space-y-4 text-left">
                {[
                  "400 Credits per month",
                  "Priority AI processing",
                  "Advanced analytics dashboard",
                  "Unlimited practice sessions",
                  "Premium support",
                  "Early access to new features",
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div
                      className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    ></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 grid md:grid-cols-4 gap-8 text-center">
          {[
            { number: "50K+", label: "Resumes Scanned", icon: FileText },
            { number: "25K+", label: "Interviews Practiced", icon: MessageSquare },
            { number: "95%", label: "Success Rate", icon: TrendingUp },
            { number: "4.9★", label: "User Rating", icon: Star },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="space-y-3 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                <Icon className="w-8 h-8 mx-auto opacity-80" />
                <div className="text-4xl font-bold">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
