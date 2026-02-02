"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signIn, signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { FileText, MessageSquare, Users, History, User, Menu, X, Sparkles, Zap, LogIn, LogOut, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "ATS Scanner", shortName: "ATS", href: "/ats-scanner", icon: FileText },
  {
    name: "Technical Interview",
    shortName: "Technical",
    href: "/technical-interview",
    icon: MessageSquare,
  },
  {
    name: "Behavioral Interview",
    shortName: "Behavioral",
    href: "/behavioral-interview",
    icon: Users,
  },
  {
    name: "Textbook Learning",
    shortName: "Learning",
    href: "/textbook-learning",
    icon: BookOpen,
  },
  { name: "Review", shortName: "Review", href: "/review", icon: History },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce">
                <Sparkles className="w-3 h-3 text-white m-0.5" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Interview Pro
              </span>
              <span className="text-xs text-muted-foreground -mt-1">AI-Powered Career</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "brand" : "ghost"}
                    className={cn(
                      "relative flex items-center space-x-2 transition-all duration-300 hover:scale-105",
                      !isActive && "text-foreground/80",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="transition-all duration-300">
                      {isActive ? item.name : item.shortName}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* Profile & Theme Toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {status === "loading" ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:scale-110 transition-all duration-300"
                  >
                    <span className="inline-flex rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-[2px]">
                      <Avatar className="h-9 w-9 bg-background">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background animate-pulse"></div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="px-2 py-1.5 text-sm font-semibold">{session.user?.name || session.user?.email}</div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive cursor-pointer flex items-center space-x-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => signIn('google')}
                variant="brand"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}

            {/* Mobile menu button */}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <Button
                    variant={isActive ? "brand" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-2",
                      !isActive && "text-foreground/80",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
