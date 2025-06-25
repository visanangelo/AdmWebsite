"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Button } from '@/features/shared/components/ui/button'
import { Menu, X, Phone, Globe, LogIn, LogOut, User } from "lucide-react"
import { cn } from '@/features/shared/lib/utils'
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { useAuth } from "@/features/shared/hooks/use-auth"
import { Suspense } from "react"
import { Metadata } from "next"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "#services" },
  { name: "Projects", href: "#projects" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
]

// Debounce function for scroll events
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()
  const { user, loading, signOut, isAdmin, isAuthenticated } = useAuth()

  // Memoized scroll handler with debouncing
  const handleScroll = useCallback(
    debounce(() => {
      setIsScrolled(window.scrollY > 0)
    }, 10),
    []
  )

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Memoized navigation handlers
  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [signOut, router])

  const handleLogin = useCallback(() => {
    router.push("/login")
  }, [router])

  const handleDashboard = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  const handleLanguageToggle = useCallback(() => {
    setLanguage(language === 'ro' ? 'en' : 'ro')
  }, [language, setLanguage])

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // Memoized header classes
  const headerClasses = useMemo(() => cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
    isScrolled || isMobileMenuOpen
      ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50"
      : "bg-transparent"
  ), [isScrolled, isMobileMenuOpen])

  // Memoized navigation link classes
  const navLinkClasses = useMemo(() => (isScrolled: boolean) => 
    `text-sm font-medium transition-colors ${
      isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
    }`,
    []
  )

  // Memoized language button classes
  const languageButtonClasses = useMemo(() => cn(
    "flex items-center space-x-2 transition-colors",
    isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
  ), [isScrolled])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50">
        <nav className="container mx-auto px-4 md:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 z-50">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                ADM Instal
              </span>
            </Link>
            <div className="hidden md:flex md:items-center md:space-x-8">
              <div className="w-20 h-8 bg-slate-200 animate-pulse rounded"></div>
            </div>
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header className={headerClasses}>
      <nav className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 z-50">
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              ADM Instal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/about"
              className={navLinkClasses(isScrolled)}
            >
              {t.footer.sections.company.links.about}
            </Link>
            <Link
              href="/services"
              className={navLinkClasses(isScrolled)}
            >
              {t.footer.sections.services.title}
            </Link>
            <Link
              href="/contact"
              className={navLinkClasses(isScrolled)}
            >
              {t.footer.sections.company.links.contact}
            </Link>
            <button
              onClick={handleLanguageToggle}
              className={languageButtonClasses}
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>
            
            {/* Authentication Buttons */}
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={handleDashboard}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            )}
            
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden relative z-50 inline-flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-slate-100/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            onClick={handleMobileMenuToggle}
          >
            <span className="sr-only">Open main menu</span>
            <div className="relative w-6 h-6 flex items-center justify-center">
              <span className={cn(
                "absolute w-6 h-0.5 bg-current transition-all duration-300",
                isScrolled ? "bg-slate-900" : "bg-white",
                isMobileMenuOpen ? "rotate-45" : "-translate-y-1.5"
              )} />
              <span className={cn(
                "absolute w-6 h-0.5 bg-current transition-all duration-300",
                isScrolled ? "bg-slate-900" : "bg-white",
                isMobileMenuOpen ? "opacity-0" : "opacity-100"
              )} />
              <span className={cn(
                "absolute w-6 h-0.5 bg-current transition-all duration-300",
                isScrolled ? "bg-slate-900" : "bg-white",
                isMobileMenuOpen ? "-rotate-45" : "translate-y-1.5"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile menu overlay */}
        <div
          className={cn(
            "md:hidden fixed inset-0 bg-black/60 transition-all duration-300 z-40",
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={handleMobileMenuClose}
        />

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-50 shadow-2xl border-l border-slate-200 transform transition-all duration-300 ease-out z-50",
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full bg-slate-50">
            {/* Mobile menu header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 bg-slate-50">
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Menu
              </span>
              <button
                onClick={handleMobileMenuClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* Mobile menu content */}
            <div className="flex-1 px-6 py-8 bg-slate-50">
              {/* Navigation Links */}
              <div className="space-y-2">
                <Link
                  href="/about"
                  className="flex items-center py-4 px-4 rounded-xl text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 font-medium text-lg"
                  onClick={handleMobileMenuClose}
                >
                  {t.footer.sections.company.links.about}
                </Link>
                <Link
                  href="/services"
                  className="flex items-center py-4 px-4 rounded-xl text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 font-medium text-lg"
                  onClick={handleMobileMenuClose}
                >
                  {t.footer.sections.services.title}
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center py-4 px-4 rounded-xl text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 font-medium text-lg"
                  onClick={handleMobileMenuClose}
                >
                  {t.footer.sections.company.links.contact}
                </Link>
              </div>

              {/* Language switcher */}
              <div className="mt-8 pt-6 border-t border-slate-200/50">
                <button
                  onClick={() => {
                    handleLanguageToggle()
                    handleMobileMenuClose()
                  }}
                  className="flex items-center space-x-3 w-full py-4 px-4 rounded-xl text-slate-700 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 font-medium text-lg"
                >
                  <Globe className="h-5 w-5" />
                  <span>Language: {language.toUpperCase()}</span>
                </button>
              </div>

              {/* Authentication Buttons for Mobile */}
              <div className="mt-8 space-y-4">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full rounded-xl py-4 text-lg font-medium"
                        onClick={() => {
                          handleMobileMenuClose()
                          handleDashboard()
                        }}
                      >
                        <User className="h-5 w-5 mr-2" />
                        Dashboard
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl py-4 text-lg font-medium"
                      onClick={() => {
                        handleMobileMenuClose()
                        handleLogout()
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg rounded-xl py-4 text-lg font-medium"
                    onClick={() => {
                      handleMobileMenuClose()
                      handleLogin()
                    }}
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Log In
                  </Button>
                )}
              </div>

              {/* Contact button */}
              <div className="mt-8">
                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg rounded-xl py-4 text-lg font-medium"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>

            {/* Mobile menu footer */}
            <div className="p-6 border-t border-slate-200/50 bg-slate-50">
              <p className="text-sm text-slate-500 text-center">
                ADM Instal © 2024
              </p>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
} 