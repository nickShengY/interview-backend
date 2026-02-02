"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MBTISelector } from "@/components/mbti-selector"
import { ZodiacSelector } from "@/components/zodiac-selector"
import { User, Coins, CreditCard, Mail, FileText, Shield, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/lib/auth-client"
import { authFetch } from "@/lib/auth-fetch"
import { PageHeader } from "@/components/page-header"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    country: "",
    mbti: "",
    zodiacSign: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [credits, setCredits] = useState<number>(0)
  const [plan, setPlan] = useState<string>("FREE")
  const [transactions, setTransactions] = useState<Array<{ id: string; type: string; delta: number; createdAt: string }>>([])
  const [showSetup, setShowSetup] = useState(false)

  // de-dupe fetches under React StrictMode
  const hasFetched = useRef(false)
  const lastFetchMsRef = useRef(0)
  const MIN_REFRESH_MS = 60_000

  // Fetch profile, credits, and transactions (once)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const now = Date.now()
        if (hasFetched.current && now - lastFetchMsRef.current < MIN_REFRESH_MS) return
        hasFetched.current = true
        lastFetchMsRef.current = now

        const [pRes, cRes, tRes] = await Promise.all([
          authFetch('/api/user/profile'),
          authFetch('/api/user/credits'),
          authFetch('/api/user/transactions?limit=100'),
        ])

        if (pRes.ok) {
          const p = await pRes.json()
          setProfile({
            name: p.name || "",
            email: p.email || "",
            country: p.country || "",
            mbti: p.mbti || "",
            zodiacSign: p.sign || "",
          })
          // Show setup if important fields missing
          const missing = !(p.name && p.country && p.mbti)
          setShowSetup(missing)
        }
        if (cRes.ok) {
          const c = await cRes.json()
          setCredits(Number(c.credits || 0))
          setPlan(String(c.plan || 'FREE'))
        }
        if (tRes.ok) {
          const t = await tRes.json()
          setTransactions(Array.isArray(t) ? t : [])
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    if (session) fetchAll()
  }, [session])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await authFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          country: profile.country,
          mbti: profile.mbti,
          sign: profile.zodiacSign,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      setIsEditing(false)
      setShowSetup(false)
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch {
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Derive monthly usage from transactions (current month, negative deltas)
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const monthlyUsed = transactions
    .filter(tx => tx.delta < 0 && new Date(tx.createdAt) >= startOfMonth)
    .reduce((sum, tx) => sum + Math.abs(tx.delta), 0)

  const planLimits: Record<string, number> = { FREE: 10, PRO: 100, ULTRA: 400 }
  const planLimit = planLimits[plan?.toUpperCase?.() || 'FREE'] ?? 10

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Profile Settings"
        description="Manage your account, preferences, and subscription"
        titleClassName="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
      />

      {/* Setup Profile Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="w-[92vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Tell us a bit about you so we can personalize interview practice and recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-setup">Full Name</Label>
              <Input id="name-setup" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country-setup">Country</Label>
              <Select value={profile.country} onValueChange={(v) => setProfile(p => ({ ...p, country: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {['United States','Canada','United Kingdom','Australia','Germany','France','Other'].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>MBTI Personality Type</Label>
              <MBTISelector value={profile.mbti} onChange={(v) => setProfile(p => ({ ...p, mbti: v }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isLoading} variant="brand" className="flex-1">
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </Button>
            <Button variant="outline" onClick={() => setShowSetup(false)} className="flex-1">Skip for now</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <TabsTrigger
            value="profile"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="credits"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Coins className="w-4 h-4" />
            <span>Credits</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <CreditCard className="w-4 h-4" />
            <span>Subscription</span>
          </TabsTrigger>
          <TabsTrigger
            value="support"
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <Mail className="w-4 h-4" />
            <span>Support</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Personal Information</span>
                  </CardTitle>
                  <CardDescription>Update your personal details and preferences</CardDescription>
                </div>
                <Button
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  variant={isEditing ? "brand" : "outline"}
                  className="transition-all duration-300 hover:scale-105"
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={profile.country}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, country: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Secure Authentication</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account is secured with Google OAuth. We never store or handle passwords directly.
                  </p>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Personality & Preferences</span>
                </h3>

                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">MBTI Personality Type</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      This helps us personalize your behavioral interview questions and feedback
                    </p>
                    <MBTISelector
                      value={profile.mbti}
                      onChange={(value) => setProfile((prev) => ({ ...prev, mbti: value }))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Zodiac Sign</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Optional: Used for additional personality insights and question personalization
                    </p>
                    <ZodiacSelector
                      value={profile.zodiacSign}
                      onChange={(value) => setProfile((prev) => ({ ...prev, zodiacSign: value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <span>Credit Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 animate-pulse">
                    {credits}
                  </div>
                  <div className="text-foreground/80 font-medium">Available Credits</div>
                  <div className="text-sm text-muted-foreground">
                    {monthlyUsed} of {planLimit} used this month
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((planLimit - monthlyUsed) / (planLimit || 1)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"></div>
              <CardHeader className="relative z-10">
                <CardTitle>Credit Usage Guide</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="space-y-3">
                  {[
                    { feature: "ATS Scans", cost: 2, icon: "🔍" },
                    { feature: "Cover Letters", cost: 3, icon: "📝" },
                    { feature: "Technical Questions", cost: 1, icon: "💻" },
                    { feature: "Behavioral Questions", cost: 1, icon: "🗣️" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded-lg bg-background/60 dark:bg-background/40 transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.feature}</span>
                      </div>
                      <Badge variant="outline" className="animate-pulse" style={{ animationDelay: `${index * 0.1}s` }}>
                        {item.cost} credits
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-spin-slow"></div>
                <span>Recent Credit Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">No transactions yet.</div>
                ) : (
                  transactions.map((tx) => {
                    const mapLabel: Record<string, { label: string; icon: string }> = {
                      ATS_SCAN: { label: 'ATS Resume Scan', icon: '🔍' },
                      COVER_LETTER: { label: 'Cover Letter Generation', icon: '📝' },
                      TECH_Q: { label: 'Technical Question', icon: '💻' },
                      BEHAV_Q: { label: 'Behavioral Question', icon: '🗣️' },
                      REWARD: { label: 'Reward', icon: '🎉' },
                      TEXTBOOK_UPLOAD: { label: 'Textbook Upload', icon: '📚' },
                      TEXTBOOK_GENERATE_FLASHCARDS: { label: 'Generate Flashcards', icon: '🧠' },
                      TEXTBOOK_GENERATE_QUIZ: { label: 'Generate Quiz', icon: '🎯' },
                      DAILY_CHECKIN: { label: 'Daily Check-in', icon: '✅' },
                      STREAK_BONUS: { label: 'Streak Bonus', icon: '🔥' },
                      STRIPE_TOPUP: { label: 'Credit Top-up', icon: '💳' },
                    }
                    const meta = mapLabel[tx.type] || { label: tx.type, icon: '✨' }
                    const dateStr = new Date(tx.createdAt).toLocaleDateString()
                    const type = tx.delta > 0 ? 'reward' : 'expense'
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 px-4 border-b border-border last:border-0 rounded-lg hover:bg-accent/50 transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{meta.icon}</span>
                          <div>
                            <div className="font-medium">{meta.label}</div>
                            <div className="text-sm text-muted-foreground">{dateStr}</div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "font-bold text-lg",
                            type === "reward" ? "text-primary" : "text-destructive",
                          )}
                        >
                          {tx.delta > 0 ? "+" : ""}
                          {tx.delta}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span>Current Plan</span>
              </CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>{(plan || 'FREE').toString().toUpperCase()} Plan</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">{planLimit} credits per month</p>
                  <p className="text-sm text-muted-foreground">Manage your subscription any time.</p>
                </div>
                <div className="text-right space-y-2">
                  <Badge variant="outline">Current</Badge>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300"
                >
                  Change Plan
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent text-destructive hover:bg-destructive/10 transition-all duration-300"
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Choose the plan that fits your career goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="relative overflow-hidden border-2 border-border hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10"></div>
                  <CardContent className="relative z-10 p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Pro Plan</h3>
                    <div className="space-y-1">
                      <div className="text-4xl font-bold text-primary">
                        $7.99
                        <span className="text-lg text-muted-foreground line-through ml-2">$11.99</span>
                      </div>
                      <p className="text-muted-foreground">/month</p>
                    </div>
                    <ul className="space-y-2 text-left text-sm">
                      {["100 Credits per month", "All ATS features", "Interview practice", "Email support"].map(
                        (feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 bg-primary rounded-full animate-pulse"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            ></div>
                            <span>{feature}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-2 border-purple-500 hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg animate-pulse">
                    POPULAR
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10"></div>
                  <CardContent className="relative z-10 p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Ultra Plan</h3>
                    <div className="space-y-1">
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">$27.99</div>
                      <p className="text-muted-foreground">/month</p>
                    </div>
                    <ul className="space-y-2 text-left text-sm">
                      {[
                        "400 Credits per month",
                        "Priority AI processing",
                        "Advanced analytics",
                        "Priority support",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          ></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span>Get Help</span>
                </CardTitle>
                <CardDescription>We&apos;re here to help you succeed</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <Button
                  variant="brand"
                  className="w-full from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:to-cyan-500 dark:hover:to-cyan-600 transition-all duration-300 hover:scale-105"
                  onClick={() => (window.location.href = "mailto:support@interviewpro.ai")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Send us an email at support@interviewpro.ai and we&apos;ll get back to you within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span>Legal & Privacy</span>
                </CardTitle>
                <CardDescription>Important information and policies</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover:scale-105"
                  onClick={() => window.open("/terms", "_blank")}
                >
                  Terms of Service
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover:scale-105"
                  onClick={() => window.open("/privacy", "_blank")}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover:scale-105"
                  onClick={() => window.open("/disclaimer", "_blank")}
                >
                  Disclaimer
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-destructive" />
                <span>Account Actions</span>
              </CardTitle>
              <CardDescription>Manage your account data and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:scale-105"
                >
                  Export Data
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 transition-all duration-300 hover:scale-105"
                >
                  Delete Account
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Account deletion is permanent and cannot be undone. All your data will be removed from our servers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
