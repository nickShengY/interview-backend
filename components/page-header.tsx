import * as React from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function PageHeader({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("text-center space-y-4", className)}>
      <h1
        className={cn(
          "text-3xl sm:text-4xl font-bold tracking-tight",
          titleClassName
        )}
      >
        {title}
      </h1>
      {description ? (
        <p
          className={cn(
            "text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
