"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "#services" },
  { name: "Projects", href: "#projects" },
  { name: "About", href: "#about" },
  { name: "Contact", href: "#contact" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-sm shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-6 md:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className={`text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent`}>
              ADM Instal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${
                isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
              }`}
            >
              {t.footer.sections.company.links.about}
            </Link>
            <Link
              href="/services"
              className={`text-sm font-medium transition-colors ${
                isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
              }`}
            >
              {t.footer.sections.services.title}
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors ${
                isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
              }`}
            >
              {t.footer.sections.company.links.contact}
            </Link>
            <button
              onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}
              className={`flex items-center space-x-2 transition-colors ${
                isScrolled ? "text-slate-900 hover:text-amber-500" : "text-white hover:text-amber-200"
              }`}
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out",
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg mt-2">
            <Link
              href="/about"
              className="text-slate-900 hover:text-amber-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.footer.sections.company.links.about}
            </Link>
            <Link
              href="/services"
              className="text-slate-900 hover:text-amber-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.footer.sections.services.title}
            </Link>
            <Link
              href="/contact"
              className="text-slate-900 hover:text-amber-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t.footer.sections.company.links.contact}
            </Link>
            <button
              onClick={() => {
                setLanguage(language === 'ro' ? 'en' : 'ro')
                setIsMobileMenuOpen(false)
              }}
              className="flex items-center space-x-2 text-slate-900 hover:text-amber-500 transition-colors"
            >
              <Globe className="h-5 w-5" />
              <span>{language.toUpperCase()}</span>
            </button>
            <Button
              size="sm"
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact Us
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
} 