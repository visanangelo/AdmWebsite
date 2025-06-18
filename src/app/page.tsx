"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Phone,
  Mail,
  Hammer,
  Building,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  Users,
  Award,
  Wrench,
  Home,
  Building2,
  PaintBucket,
  Settings,
  HardHat,
  Clipboard,
  Quote,
  FileCheck,
  Target,
  Briefcase,
  GraduationCap,
  Medal,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Check,
  Send,
} from "lucide-react"
import Link from "next/link"
import { AnimatedStat } from "@/components/ui/animated-stat"
import { Navbar } from "@/components/ui/navbar"
import { useLanguage } from '@/contexts/language-context'
import BlurText from "@/components/ui/blur-text"
import { translations } from "@/config/languages"
import { motion } from "framer-motion"

export default function HomePage() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const services = [
    {
      title: "Residential Construction",
      description: "Custom homes and residential renovations built to the highest standards with attention to detail.",
      icon: Home,
      accent: "border-l-yellow-500",
    },
    {
      title: "Commercial Projects",
      description:
        "Office buildings, retail spaces, and commercial facilities designed for functionality and durability.",
      icon: Building2,
      accent: "border-l-slate-500",
    },
    {
      title: "Renovations & Remodeling",
      description: "Transform your existing space with our comprehensive renovation and remodeling services.",
      icon: PaintBucket,
      accent: "border-l-stone-500",
    },
    {
      title: "Project Management",
      description: "End-to-end project coordination ensuring timely delivery and quality craftsmanship.",
      icon: Clipboard,
      accent: "border-l-gray-500",
    },
    {
      title: "Maintenance Services",
      description: "Ongoing maintenance and repair services to keep your property in excellent condition.",
      icon: Settings,
      accent: "border-l-yellow-600",
    },
    {
      title: "Safety & Consultation",
      description: "Expert consultation and detailed planning to bring your construction vision to life safely.",
      icon: HardHat,
      accent: "border-l-slate-600",
    },
  ]

  const stats = [
    { icon: Clock, number: 10, label: "Years Experience", suffix: "+" },
    { icon: Building, number: 200, label: "Projects Completed", suffix: "+" },
    { icon: Users, number: 150, label: "Happy Clients", suffix: "+" },
    { icon: Award, number: 25, label: "Awards Won", suffix: "+" },
  ]

  const process = [
    {
      step: "01",
      title: "Initial Consultation",
      description: "We meet with you to understand your vision, requirements, and budget constraints.",
      icon: Briefcase,
    },
    {
      step: "02",
      title: "Design & Planning",
      description: "Our team creates detailed plans and designs tailored to your specific needs.",
      icon: FileCheck,
    },
    {
      step: "03",
      title: "Project Execution",
      description: "We execute the project with precision, maintaining quality and timeline standards.",
      icon: Hammer,
    },
    {
      step: "04",
      title: "Final Delivery",
      description: "We deliver your completed project and provide ongoing support and maintenance.",
      icon: CheckCircle,
    },
  ]

  const testimonials = [
    {
      quote:
        "ADM Instal transformed our office space beyond our expectations. Their attention to detail and professionalism throughout the project was exceptional.",
      author: "Sarah Mitchell",
      position: "CEO",
      company: "TechCorp Solutions",
      rating: 5,
    },
    {
      quote:
        "The team at ADM Instal delivered our residential project on time and within budget. The quality of workmanship is outstanding.",
      author: "Michael Chen",
      position: "Property Developer",
      company: "Chen Development Group",
      rating: 5,
    },
    {
      quote:
        "Professional, reliable, and skilled. ADM Instal has been our go-to construction partner for multiple commercial projects.",
      author: "Jennifer Rodriguez",
      position: "Operations Director",
      company: "Metro Properties",
      rating: 5,
    },
  ]

  const certifications = [
    { name: "Licensed General Contractor", code: "GC-2024-001" },
    { name: "OSHA Safety Certified", code: "OSHA-30-2024" },
    { name: "Green Building Council Member", code: "USGBC-2024" },
    { name: "Better Business Bureau A+", code: "BBB-A+-2024" },
  ]

  const team = [
    {
      name: "David Martinez",
      position: "Founder & CEO",
      credentials: "Licensed General Contractor, 15+ Years Experience",
      expertise: "Commercial Construction, Project Management",
    },
    {
      name: "Lisa Thompson",
      position: "Chief Operations Officer",
      credentials: "Construction Management Degree, PMP Certified",
      expertise: "Operations, Quality Control, Client Relations",
    },
    {
      name: "Robert Kim",
      position: "Lead Project Manager",
      credentials: "Civil Engineering Degree, LEED Certified",
      expertise: "Residential Projects, Sustainable Building",
    },
  ]

  const projects = [
    {
      title: "Downtown Office Complex",
      category: "Commercial",
      description: "50,000 sq ft modern office building with sustainable design features.",
      specs: ["LEED Gold Certified", "6-Month Timeline", "$2.5M Project Value"],
    },
    {
      title: "Luxury Residential Estate",
      category: "Residential",
      description: "Custom 8,000 sq ft home with premium finishes and smart home integration.",
      specs: ["Smart Home Technology", "Premium Materials", "Award-Winning Design"],
    },
    {
      title: "Retail Shopping Center",
      category: "Commercial",
      description: "Mixed-use development with retail spaces and parking facilities.",
      specs: ["Multi-Phase Construction", "On-Time Delivery", "Tenant Ready"],
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-[95vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-slate-800 z-10" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-800/30 via-transparent to-slate-700/40 z-12" />
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px] z-15" />
        <div className="absolute inset-0 bg-[radial-gradient(square_at_2px_2px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:8px_8px] z-16" />
        <div className="absolute inset-0 bg-[radial-gradient(square_at_4px_4px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:16px_16px] z-17" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/70 z-20" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-950/20 via-transparent to-slate-900/30 z-25" />
        <div className="container relative z-30 text-center px-6 py-6 md:py-12 rounded-2xl shadow-2xl mx-4 md:mx-8">
          <BlurText
            text={t.hero.title}
            className="text-3xl md:text-5xl font-bold text-white mb-4"
            highlightWord={language === "en" ? "Vision" : "Viziunea"}
          />
          <p className="text-lg md:text-xl text-slate-200 mb-6 max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            {t.hero.cta}
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-300 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="container mx-auto px-6 md:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Clock, number: 10, suffix: "+", label: t.stats.yearsExperience },
              { icon: Building, number: 200, suffix: "+", label: t.stats.projectsCompleted },
              { icon: Users, number: 150, suffix: "+", label: t.stats.clientSatisfaction },
              { icon: Award, number: 25, suffix: "+", label: t.stats.awardsWon }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-4">
                  <div className="p-5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <AnimatedStat
                  value={stat.number}
                  suffix={stat.suffix}
                  className="text-3xl font-bold text-white mb-1 drop-shadow-sm"
                />
                <p className="text-white/90 font-medium text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-20 md:py-28 bg-stone-50 border-t border-gray-200">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <div className="inline-flex items-center space-x-3 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full text-sm font-semibold tracking-wide">
                <Target className="h-4 w-4 text-yellow-600" />
                <span>{t.process.title}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">{t.process.title}</h2>
              <div className="w-24 h-0.5 bg-yellow-500 mx-auto"></div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {t.process.subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", icon: Briefcase, ...t.process.steps.consultation },
                { step: "02", icon: FileCheck, ...t.process.steps.planning },
                { step: "03", icon: Hammer, ...t.process.steps.execution },
                { step: "04", icon: CheckCircle, ...t.process.steps.delivery }
              ].map((step, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 relative"
                >
                  <CardContent className="p-8 text-center">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-stone-100 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                      <step.icon className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20 md:py-28 bg-stone-50 border-t border-gray-200">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <div className="inline-flex items-center space-x-3 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full text-sm font-semibold tracking-wide">
                <Eye className="h-4 w-4 text-yellow-600" />
                <span>{t.projects.subtitle}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">{t.projects.title}</h2>
              <div className="w-24 h-0.5 bg-yellow-500 mx-auto"></div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {t.projects.description}
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                t.projects.items.office,
                t.projects.items.residential,
                t.projects.items.retail
              ].map((project, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300"
                >
                  <CardContent className="p-0">
                    <div className="h-48 bg-stone-100 border-b border-gray-200 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="p-8">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                            {project.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{project.description}</p>
                        <div className="space-y-2">
                          {project.specs.map((spec, specIndex) => (
                            <div key={specIndex} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-gray-600">{spec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <div className="inline-flex items-center space-x-3 bg-stone-50 border border-gray-200 text-gray-700 px-6 py-3 rounded-full text-sm font-semibold tracking-wide">
                <Quote className="h-4 w-4 text-yellow-600" />
                <span>{t.testimonials.subtitle}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">{t.testimonials.title}</h2>
              <div className="w-24 h-0.5 bg-yellow-500 mx-auto"></div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                t.testimonials.items.techCorp,
                t.testimonials.items.chenDev,
                t.testimonials.items.metroProps
              ].map((testimonial, index) => (
                <Card
                  key={index}
                  className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300"
                >
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <blockquote className="text-gray-700 leading-relaxed italic">"{testimonial.quote}"</blockquote>
                      <div className="border-t border-gray-200 pt-6">
                        <div className="space-y-1">
                          <p className="font-bold text-gray-900">{testimonial.author}</p>
                          <p className="text-sm text-gray-600">
                            {testimonial.position}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-6 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">{t.company.name}</h3>
                <button
                  onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}
                  className="flex items-center space-x-2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  <span className="text-sm">{language.toUpperCase()}</span>
                </button>
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                {t.company.description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-amber-500" />
                  <span>{t.contact.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-amber-500" />
                  <span>{t.contact.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  <span>{t.contact.address}</span>
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <Link href="https://facebook.com/adminstal" className="text-slate-400 hover:text-amber-500 transition-colors">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="https://instagram.com/adminstal" className="text-slate-400 hover:text-amber-500 transition-colors">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="https://linkedin.com/company/adminstal" className="text-slate-400 hover:text-amber-500 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Footer Sections */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.sections.company.title}</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.company.links.about}
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.company.links.team}
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.company.links.careers}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.company.links.contact}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.sections.services.title}</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/services/residential" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.services.links.residential}
                  </Link>
                </li>
                <li>
                  <Link href="/services/commercial" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.services.links.commercial}
                  </Link>
                </li>
                <li>
                  <Link href="/services/interior-design" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.services.links.interior}
                  </Link>
                </li>
                <li>
                  <Link href="/services/renovations" className="text-slate-400 hover:text-amber-500 transition-colors text-sm">
                    {t.footer.sections.services.links.renovations}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Google Maps */}
          <div className="mt-12 rounded-lg overflow-hidden h-[300px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2838.979615768499!2d22.696269176271407!3d44.63833358816147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475231867a6ac7cb%3A0x1865ce80405edd62!2sAutoCos%20III%20Beton%26sorturi!5e0!3m2!1sro!2sro!4v1750242487452!5m2!1sro!2sro"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 mt-8 pt-6">
            <p className="text-slate-400 text-sm text-center">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
