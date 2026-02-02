"use client"

import { Progress } from "@/components/ui/progress"

interface AtsResultProps {
  traditional: number
  ai: number
  penalty: number
  missing: string[]
}

export function AtsResult({ traditional, ai, penalty, missing }: AtsResultProps) {
  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-card/60 backdrop-blur border-border">
          <h3 className="font-semibold mb-2 text-foreground">Traditional ATS Score</h3>
          <Progress value={traditional} className="bg-muted" />
          <p className="mt-2 text-sm text-muted-foreground">Penalty for formatting: -{penalty}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card/60 backdrop-blur border-border">
          <h3 className="font-semibold mb-2 text-foreground">AI Semantic Score</h3>
          <Progress value={ai} className="bg-muted" />
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-card/60 backdrop-blur border-border">
        <h3 className="font-semibold mb-2 text-foreground">Missing Keywords</h3>
        {missing.length ? (
          <div className="flex flex-wrap gap-2">
            {missing.map((kw) => (
              <span key={kw} className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-sm rounded border border-yellow-200 dark:border-yellow-800">
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-green-600 dark:text-green-400">Great! No critical keywords missing.</p>
        )}
      </div>
    </div>
  )
}
