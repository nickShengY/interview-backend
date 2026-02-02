"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SKILLS } from "@/data/technical-taxonomy"

interface SkillComboboxProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  label?: string
}

export function SkillCombobox({ value, onChange, placeholder = "Select a skill", label }: SkillComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredSkills = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return SKILLS
    return SKILLS.filter((skill) => skill.toLowerCase().includes(term))
  }, [search])

  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium text-foreground">{label}</div> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? value : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search skills..."
              autoFocus
            />
            <CommandEmpty>No skill found.</CommandEmpty>
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandGroup>
                {filteredSkills.map((skill) => (
                  <CommandItem
                    key={skill}
                    value={skill}
                    onSelect={(currentValue) => {
                      const nextValue = currentValue === value ? "" : currentValue
                      onChange(nextValue)
                      requestAnimationFrame(() => setOpen(false))
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === skill ? "opacity-100" : "opacity-0")}
                    />
                    {skill}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
