export interface Service {
  name: string
  description: string
  icon: string
}

export interface FooterLink {
  name: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

export interface FooterBottom {
  copyright: string
  certifications: string[]
}

export interface Footer {
  sections: FooterSection[]
  bottom: FooterBottom
}

export interface Social {
  facebook: string
  instagram: string
  linkedin: string
}

export interface Contact {
  phone: string
  email: string
  address: string
  hours: string
}

export interface Company {
  name: string
  description: string
  license: string
  insurance: string
}

export interface SiteConfig {
  name: string
  description: string
  company: {
    name: string
    license: string
    insurance: string
  }
  contact: {
    phone: string
    email: string
    address: string
    hours: string
  }
  social: {
    facebook: string
    instagram: string
    linkedin: string
  }
  services: Service[]
  footer: {
    sections: FooterSection[]
    bottom: FooterBottom
  }
}

export const siteConfig: SiteConfig = {
  name: "ADM Instal",
  description: "Specializing in high-quality construction and design solutions for residential and commercial projects.",
  company: {
    name: "ADM Instal",
    license: "License #123456",
    insurance: "Fully Insured"
  },
  contact: {
    phone: "+1 (555) 123-4567",
    email: "info@adminstal.com",
    address: "123 Construction Ave, Building City, ST 12345",
    hours: "Monday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed"
  },
  social: {
    facebook: "https://facebook.com/adminstal",
    instagram: "https://instagram.com/adminstal",
    linkedin: "https://linkedin.com/company/adminstal"
  },
  services: [
    {
      name: "Residential Construction",
      description: "Custom homes and renovations",
      icon: "home"
    },
    {
      name: "Commercial Projects",
      description: "Office buildings and retail spaces",
      icon: "building"
    },
    {
      name: "Interior Design",
      description: "Modern and functional spaces",
      icon: "paint-bucket"
    }
  ],
  footer: {
    sections: [
      {
        title: "Company",
        links: [
          { name: "About Us", href: "/about" },
          { name: "Our Team", href: "/team" },
          { name: "Careers", href: "/careers" },
          { name: "Contact", href: "/contact" }
        ]
      },
      {
        title: "Services",
        links: [
          { name: "Residential", href: "/services/residential" },
          { name: "Commercial", href: "/services/commercial" },
          { name: "Interior Design", href: "/services/interior-design" },
          { name: "Renovations", href: "/services/renovations" }
        ]
      }
    ],
    bottom: {
      copyright: "© 2024 ADM Instal. All rights reserved.",
      certifications: []
    }
  }
} 