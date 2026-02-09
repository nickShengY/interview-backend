"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Plus, Trash2, Trophy, TrendingUp, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Offer = {
  id: string
  company: string
  role: string
  baseSalary: number
  bonus: number
  equity: number
  pto: number
  remote: string
  benefits: number
  growth: number
  culture: number
  location: string
}

function createEmptyOffer(): Offer {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    baseSalary: 0,
    bonus: 0,
    equity: 0,
    pto: 15,
    remote: "hybrid",
    benefits: 3,
    growth: 3,
    culture: 3,
    location: "",
  }
}

function loadOffers(): Offer[] {
  if (typeof window === "undefined") return [createEmptyOffer(), createEmptyOffer()]
  try {
    const raw = localStorage.getItem("offer_comparison")
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) && parsed.length >= 2 ? parsed : [createEmptyOffer(), createEmptyOffer()]
    }
  } catch {}
  return [createEmptyOffer(), createEmptyOffer()]
}

function saveOffers(offers: Offer[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("offer_comparison", JSON.stringify(offers))
}

function computeScore(offer: Offer): number {
  const salaryScore = Math.min(offer.baseSalary / 2000, 50)
  const bonusScore = Math.min(offer.bonus / 200, 15)
  const equityScore = Math.min(offer.equity / 500, 10)
  const ptoScore = Math.min(offer.pto / 2, 10)
  const remoteScore = offer.remote === "full" ? 5 : offer.remote === "hybrid" ? 3 : 1
  const benefitsScore = offer.benefits
  const growthScore = offer.growth
  const cultureScore = offer.culture
  return Math.round(salaryScore + bonusScore + equityScore + ptoScore + remoteScore + benefitsScore + growthScore + cultureScore)
}

export function OfferComparisonTool() {
  const [offers, setOffers] = useState<Offer[]>([createEmptyOffer(), createEmptyOffer()])
  const { toast } = useToast()

  useEffect(() => { setOffers(loadOffers()) }, [])

  const updateOffer = (id: string, field: keyof Offer, value: string | number) => {
    const updated = offers.map(o => o.id === id ? { ...o, [field]: value } : o)
    setOffers(updated)
    saveOffers(updated)
  }

  const addOffer = () => {
    if (offers.length >= 5) {
      toast({ title: "Maximum Reached", description: "You can compare up to 5 offers.", variant: "destructive" })
      return
    }
    const updated = [...offers, createEmptyOffer()]
    setOffers(updated)
    saveOffers(updated)
  }

  const removeOffer = (id: string) => {
    if (offers.length <= 2) {
      toast({ title: "Minimum Required", description: "You need at least 2 offers to compare.", variant: "destructive" })
      return
    }
    const updated = offers.filter(o => o.id !== id)
    setOffers(updated)
    saveOffers(updated)
  }

  const scores = offers.map(o => ({ id: o.id, company: o.company || "Unnamed", score: computeScore(o) }))
  const maxScore = Math.max(...scores.map(s => s.score), 1)
  const winner = scores.reduce((a, b) => a.score > b.score ? a : b)

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl"><BarChart3 className="w-5 h-5 text-emerald-600" /> Offer Comparison Tool</CardTitle>
              <CardDescription>Compare multiple job offers side-by-side with weighted scoring.</CardDescription>
            </div>
            <Button onClick={addOffer} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Offer</Button>
          </div>
        </CardHeader>
      </Card>

      {/* Score Summary */}
      {offers.some(o => o.company) && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
            <h3 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> Score Comparison</h3>
          </div>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {scores.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium truncate">{s.company}</span>
                  <div className="flex-1 bg-muted/30 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white transition-all duration-500 ${
                        s.id === winner.id ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-gray-400 to-gray-500"
                      }`}
                      style={{ width: `${Math.max((s.score / maxScore) * 100, 10)}%` }}
                    >
                      {s.score}
                    </div>
                  </div>
                  {s.id === winner.id && <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 shrink-0">Best</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offer Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer, i) => (
          <Card key={offer.id} className={`relative transition-all duration-300 ${offer.id === winner.id && offer.company ? "ring-2 ring-emerald-500 shadow-lg" : ""}`}>
            {offers.length > 2 && (
              <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-muted-foreground hover:text-red-500" onClick={() => removeOffer(offer.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Offer {i + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <Input placeholder="Company name" value={offer.company} onChange={e => updateOffer(offer.id, "company", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Input placeholder="Job title" value={offer.role} onChange={e => updateOffer(offer.id, "role", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Base Salary (annual)</Label>
                <Input type="number" placeholder="120000" value={offer.baseSalary || ""} onChange={e => updateOffer(offer.id, "baseSalary", Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Annual Bonus</Label>
                  <Input type="number" placeholder="15000" value={offer.bonus || ""} onChange={e => updateOffer(offer.id, "bonus", Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Equity/yr</Label>
                  <Input type="number" placeholder="25000" value={offer.equity || ""} onChange={e => updateOffer(offer.id, "equity", Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">PTO Days</Label>
                  <Input type="number" placeholder="20" value={offer.pto || ""} onChange={e => updateOffer(offer.id, "pto", Number(e.target.value))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Remote</Label>
                  <Select value={offer.remote} onValueChange={v => updateOffer(offer.id, "remote", v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: "benefits" as const, label: "Benefits Quality" },
                  { key: "growth" as const, label: "Growth Potential" },
                  { key: "culture" as const, label: "Culture Fit" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => updateOffer(offer.id, key, n)}
                          className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                            n <= offer[key] ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input placeholder="City, State" value={offer.location} onChange={e => updateOffer(offer.id, "location", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Comp</span>
                  <span className="font-bold text-emerald-600">${(offer.baseSalary + offer.bonus + offer.equity).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
