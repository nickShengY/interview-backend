"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Plus, Trash2, Edit2, Save, X, Search, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type StarStory = {
  id: string
  title: string
  category: string
  situation: string
  task: string
  action: string
  result: string
  tags: string[]
  createdAt: string
}

const CATEGORIES = [
  "Leadership", "Teamwork", "Problem Solving", "Conflict Resolution",
  "Initiative", "Communication", "Adaptability", "Time Management",
  "Customer Focus", "Innovation", "Failure/Learning", "Achievement",
]

function loadStories(): StarStory[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("star_stories")
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveStories(stories: StarStory[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("star_stories", JSON.stringify(stories))
}

export function StarStoryBank() {
  const [stories, setStories] = useState<StarStory[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const { toast } = useToast()

  const [form, setForm] = useState({ title: "", category: "", situation: "", task: "", action: "", result: "", tags: "" })

  useEffect(() => { setStories(loadStories()) }, [])

  const handleSave = () => {
    if (!form.title || !form.situation || !form.task || !form.action || !form.result) {
      toast({ title: "Incomplete Story", description: "Please fill in all STAR fields.", variant: "destructive" })
      return
    }
    const story: StarStory = {
      id: editingId || crypto.randomUUID(),
      title: form.title,
      category: form.category || "General",
      situation: form.situation,
      task: form.task,
      action: form.action,
      result: form.result,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      createdAt: editingId ? stories.find(s => s.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    }
    const updated = editingId ? stories.map(s => s.id === editingId ? story : s) : [...stories, story]
    setStories(updated)
    saveStories(updated)
    setForm({ title: "", category: "", situation: "", task: "", action: "", result: "", tags: "" })
    setIsAdding(false)
    setEditingId(null)
    toast({ title: editingId ? "Story Updated!" : "Story Saved!", description: `"${story.title}" has been saved to your story bank.` })
  }

  const handleEdit = (story: StarStory) => {
    setForm({ title: story.title, category: story.category, situation: story.situation, task: story.task, action: story.action, result: story.result, tags: story.tags.join(", ") })
    setEditingId(story.id)
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    const updated = stories.filter(s => s.id !== id)
    setStories(updated)
    saveStories(updated)
    toast({ title: "Story Deleted" })
  }

  const filtered = stories.filter(s => {
    const matchesSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = filterCategory === "all" || s.category === filterCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="w-5 h-5 text-amber-600" /> STAR Story Bank
              </CardTitle>
              <CardDescription>Organize your behavioral interview stories using the STAR method. {stories.length} stories saved.</CardDescription>
            </div>
            <Button onClick={() => { setIsAdding(true); setEditingId(null); setForm({ title: "", category: "", situation: "", task: "", action: "", result: "", tags: "" }) }} variant="brand" className="from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <Plus className="w-4 h-4 mr-2" /> Add Story
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isAdding && (
        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Story" : "New STAR Story"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Story Title *</Label>
                <Input placeholder="e.g. Led cross-team migration project" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">S</Badge> Situation *</Label>
              <Textarea placeholder="Describe the context and background..." value={form.situation} onChange={e => setForm({ ...form, situation: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">T</Badge> Task *</Label>
              <Textarea placeholder="What was your responsibility or goal?" value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">A</Badge> Action *</Label>
              <Textarea placeholder="What specific steps did you take?" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">R</Badge> Result *</Label>
              <Textarea placeholder="What was the outcome? Include metrics if possible." value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="e.g. leadership, python, agile" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setIsAdding(false); setEditingId(null) }}><X className="w-4 h-4 mr-1" /> Cancel</Button>
              <Button onClick={handleSave} variant="brand" className="from-amber-600 to-orange-600"><Save className="w-4 h-4 mr-1" /> Save Story</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stories.length > 0 && (
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search stories or tags..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        {filtered.length === 0 && stories.length > 0 && (
          <Card className="bg-muted/20"><CardContent className="pt-6 text-center text-muted-foreground">No stories match your search.</CardContent></Card>
        )}
        {filtered.length === 0 && stories.length === 0 && !isAdding && (
          <Card className="bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-900/5 dark:to-orange-900/5">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <Star className="w-12 h-12 mx-auto text-amber-400" />
              <div>
                <h3 className="font-semibold text-lg mb-1">No Stories Yet</h3>
                <p className="text-muted-foreground">Start building your STAR story bank to ace behavioral interviews.</p>
              </div>
              <Button onClick={() => setIsAdding(true)} variant="brand" className="from-amber-600 to-orange-600"><Plus className="w-4 h-4 mr-2" /> Add Your First Story</Button>
            </CardContent>
          </Card>
        )}
        {filtered.map(story => (
          <Card key={story.id} className="hover:shadow-lg transition-all duration-300 group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{story.category}</Badge>
                    {story.tags.map(t => <Badge key={t} className="bg-muted text-muted-foreground text-xs">{t}</Badge>)}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(story)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(story.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { label: "S", text: story.situation, color: "border-blue-300 dark:border-blue-700" },
                  { label: "T", text: story.task, color: "border-green-300 dark:border-green-700" },
                  { label: "A", text: story.action, color: "border-purple-300 dark:border-purple-700" },
                  { label: "R", text: story.result, color: "border-amber-300 dark:border-amber-700" },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-lg bg-muted/20 border-l-4 ${item.color}`}>
                    <p className="text-xs font-bold text-muted-foreground mb-1">{item.label === "S" ? "Situation" : item.label === "T" ? "Task" : item.label === "A" ? "Action" : "Result"}</p>
                    <p className="text-sm text-foreground/80">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
