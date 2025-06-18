export type Language = 'ro' | 'en'

export interface Translations {
  company: {
    name: string
    description: string
    license: string
    insurance: string
  }
  contact: {
    phone: string
    email: string
    address: string
    hours: string
    formSubmitting: string
    formSuccess: string
    formError: string
  }
  hero: {
    title: string
    subtitle: string
    cta: string
  }
  stats: {
    yearsExperience: string
    projectsCompleted: string
    clientSatisfaction: string
    awardsWon: string
    title: string
    subtitle: string
  }
  services: {
    title: string
    subtitle: string
    items: {
      construction: {
        title: string
        description: string
      }
      aggregates: {
        title: string
        description: string
      }
      demolition: {
        title: string
        description: string
      }
      consulting: {
        title: string
        description: string
      }
    }
  }
  contactForm: {
    title: string
    name: string
    email: string
    message: string
    send: string
    sending: string
    thankYou: string
    response: string
    validationError: string
    successMessage: string
    errorMessage: string
    namePlaceholder: string
    emailPlaceholder: string
    messagePlaceholder: string
  }
  footer: {
    sections: {
      company: {
        title: string
        links: {
          about: string
          team: string
          careers: string
          contact: string
        }
      }
      services: {
        title: string
        links: {
          residential: string
          commercial: string
          interior: string
          renovations: string
        }
      }
    }
    copyright: string
  }
  nav: {
    home: string
    about: string
    services: string
    contact: string
  }
  about: {
    title: string
    subtitle: string
    description: string
    stats: {
      projects: string
      clients: string
      experience: string
    }
  }
  process: {
    title: string
    subtitle: string
    steps: {
      consultation: {
        title: string
        description: string
      }
      planning: {
        title: string
        description: string
      }
      execution: {
        title: string
        description: string
      }
      delivery: {
        title: string
        description: string
      }
    }
  }
  projects: {
    title: string
    subtitle: string
    description: string
    items: {
      office: {
        title: string
        category: string
        description: string
        specs: string[]
      }
      residential: {
        title: string
        category: string
        description: string
        specs: string[]
      }
      retail: {
        title: string
        category: string
        description: string
        specs: string[]
      }
    }
  }
  testimonials: {
    title: string
    subtitle: string
    items: {
      techCorp: {
        quote: string
        author: string
        position: string
        company: string
      }
      chenDev: {
        quote: string
        author: string
        position: string
        company: string
      }
      metroProps: {
        quote: string
        author: string
        position: string
        company: string
      }
    }
  }
}

export const translations: Record<Language, Translations> = {
  ro: {
    company: {
      name: "ADM Instal",
      description: "Specializată în soluții de construcții și design de înaltă calitate pentru proiecte rezidențiale și comerciale.",
      license: "Licență #123456",
      insurance: "Asigurată Complet"
    },
    contact: {
      phone: "Telefon",
      email: "Email",
      address: "Adresă",
      hours: "Program de Lucru",
      formSubmitting: "Se trimite mesajul...",
      formSuccess: "Mesajul a fost trimis cu succes!",
      formError: "A apărut o eroare la trimiterea mesajului. Vă rugăm să încercați din nou.",
    },
    hero: {
      title: "Transformăm Viziunea Ta în Realitate",
      subtitle: "Servicii profesionale de construcții și agregate pentru proiectele tale",
      cta: "Începe Acum",
    },
    stats: {
      title: "Rezultatele Noastre",
      subtitle: "Numerele care demonstrează excelența noastră",
      yearsExperience: "Ani de Experiență",
      projectsCompleted: "Proiecte Finalizate",
      clientSatisfaction: "Clienți Mulțumiți",
      awardsWon: "Premii Câștigate"
    },
    services: {
      title: "Serviciile Noastre",
      subtitle: "Soluții complete de construcții și agregate",
      items: {
        construction: {
          title: "Servicii de Construcții",
          description: "Soluții complete de construcții pentru proiecte rezidențiale și comerciale",
        },
        aggregates: {
          title: "Furnizare Agregate",
          description: "Agregate și materiale de construcții de înaltă calitate",
        },
        demolition: {
          title: "Servicii de Demolare",
          description: "Demolări profesionale și pregătire șantier",
        },
        consulting: {
          title: "Consultanță Construcții",
          description: "Sfaturi specializate și servicii de management de proiect",
        },
      },
    },
    contactForm: {
      title: "Contactează-ne",
      name: "Nume",
      email: "Email",
      message: "Mesaj",
      send: "Trimite Mesajul",
      sending: "Se trimite...",
      thankYou: "Mulțumim!",
      response: "Vă vom răspunde în cel mai scurt timp.",
      validationError: "Vă rugăm să completați toate câmpurile obligatorii.",
      successMessage: "Mesajul a fost trimis cu succes! Vă vom răspunde în curând.",
      errorMessage: "A apărut o eroare la trimiterea mesajului. Vă rugăm să încercați din nou.",
      namePlaceholder: "Introduceți numele complet",
      emailPlaceholder: "Introduceți adresa de email",
      messagePlaceholder: "Spuneți-ne despre proiectul dvs...",
    },
    footer: {
      sections: {
        company: {
          title: "Companie",
          links: {
            about: "Despre Noi",
            team: "Echipa Noastră",
            careers: "Cariere",
            contact: "Contact"
          }
        },
        services: {
          title: "Servicii",
          links: {
            residential: "Rezidențial",
            commercial: "Comercial",
            interior: "Design Interior",
            renovations: "Renovări"
          }
        }
      },
      copyright: "© 2024 ADM Instal. Toate drepturile rezervate."
    },
    nav: {
      home: "Acasă",
      about: "Despre Noi",
      services: "Servicii",
      contact: "Contact",
    },
    about: {
      title: "Despre Noi",
      subtitle: "Partenerul tău de încredere în construcții",
      description: "Cu ani de experiență și o echipă de profesioniști calificați, oferim servicii de construcții și agregate de înaltă calitate adaptate nevoilor tale.",
      stats: {
        projects: "Proiecte Finalizate",
        clients: "Clienți Mulțumiți",
        experience: "Ani de Experiență",
      },
    },
    process: {
      title: "Cum Lucrăm",
      subtitle: "Procesul nostru în patru pași asigură livrarea fiecărui proiect la timp, în buget și la cele mai înalte standarde de calitate.",
      steps: {
        consultation: {
          title: "Consultare Inițială",
          description: "Ne întâlnim cu dvs. pentru a înțelege viziunea, cerințele și constrângerile bugetare."
        },
        planning: {
          title: "Design și Planificare",
          description: "Echipa noastră creează planuri și designuri detaliate adaptate nevoilor dvs. specifice."
        },
        execution: {
          title: "Execuție Proiect",
          description: "Executăm proiectul cu precizie, menținând standardele de calitate și termenele limită."
        },
        delivery: {
          title: "Livrare Finală",
          description: "Vă livrăm proiectul finalizat și oferim suport continuu și mentenanță."
        }
      }
    },
    projects: {
      title: "Proiecte Selectate",
      subtitle: "Lucrările Noastre",
      description: "Demonstrăm angajamentul nostru față de excelență prin livrarea cu succes a proiectelor din diverse sectoare.",
      items: {
        office: {
          title: "Complex de Birouri în Centru",
          category: "Comercial",
          description: "Clădire modernă de birouri de 50.000 mp cu caracteristici de design sustenabil.",
          specs: [
            "Certificat LEED Gold",
            "Timp de execuție: 6 luni",
            "Valoare proiect: 2.5M €"
          ]
        },
        residential: {
          title: "Reședință de Lux",
          category: "Rezidențial",
          description: "Casă personalizată de 8.000 mp cu finisaje premium și integrare smart home.",
          specs: [
            "Tehnologie Smart Home",
            "Materiale Premium",
            "Design Premiat"
          ]
        },
        retail: {
          title: "Centru Comercial",
          category: "Comercial",
          description: "Dezvoltare mixtă cu spații comerciale și facilități de parcare.",
          specs: [
            "Construcție Multi-fază",
            "Livrare la Timp",
            "Gata pentru Chiriași"
          ]
        }
      }
    },
    testimonials: {
      title: "Ce Spun Clienții Noștri",
      subtitle: "Testimoniale",
      items: {
        techCorp: {
          quote: "ADM Instal a transformat spațiul nostru de birouri dincolo de așteptări. Atenția la detalii și profesionalismul lor de-a lungul proiectului a fost excepțional.",
          author: "Sarah Mitchell",
          position: "CEO",
          company: "TechCorp Solutions"
        },
        chenDev: {
          quote: "Echipa de la ADM Instal a livrat proiectul nostru rezidențial la timp și în buget. Calitatea execuției este remarcabilă.",
          author: "Michael Chen",
          position: "Dezvoltator Imobiliar",
          company: "Chen Development Group"
        },
        metroProps: {
          quote: "Profesioniști, de încredere și pricepuți. ADM Instal a fost partenerul nostru de construcții pentru multiple proiecte comerciale.",
          author: "Jennifer Rodriguez",
          position: "Director Operațional",
          company: "Metro Properties"
        }
      }
    },
  },
  en: {
    company: {
      name: "ADM Instal",
      description: "Specializing in high-quality construction and design solutions for residential and commercial projects.",
      license: "License #123456",
      insurance: "Fully Insured"
    },
    contact: {
      phone: "Phone",
      email: "Email",
      address: "Address",
      hours: "Working Hours",
      formSubmitting: "Submitting your message...",
      formSuccess: "Your message has been sent successfully!",
      formError: "There was an error sending your message. Please try again.",
    },
    hero: {
      title: "Building Your Vision Into Reality",
      subtitle: "Professional construction and aggregate services for your projects",
      cta: "Get Started",
    },
    stats: {
      title: "Our Results",
      subtitle: "Numbers that demonstrate our excellence",
      yearsExperience: "Years Experience",
      projectsCompleted: "Projects Completed",
      clientSatisfaction: "Happy Clients",
      awardsWon: "Awards Won"
    },
    services: {
      title: "Our Services",
      subtitle: "Comprehensive construction and aggregate solutions",
      items: {
        construction: {
          title: "Construction Services",
          description: "Complete construction solutions for residential and commercial projects",
        },
        aggregates: {
          title: "Aggregate Supply",
          description: "High-quality construction aggregates and materials",
        },
        demolition: {
          title: "Demolition Services",
          description: "Professional demolition and site preparation",
        },
        consulting: {
          title: "Construction Consulting",
          description: "Expert advice and project management services",
        },
      },
    },
    contactForm: {
      title: "Contact Us",
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send",
      sending: "Sending...",
      thankYou: "Thank You!",
      response: "We'll get back to you as soon as possible.",
      validationError: "Please fill in all required fields.",
      successMessage: "Message sent successfully! We'll get back to you soon.",
      errorMessage: "An error occurred while sending the message. Please try again.",
      namePlaceholder: "Enter your full name",
      emailPlaceholder: "Enter your email address",
      messagePlaceholder: "Tell us about your project...",
    },
    footer: {
      sections: {
        company: {
          title: "Company",
          links: {
            about: "About Us",
            team: "Our Team",
            careers: "Careers",
            contact: "Contact"
          }
        },
        services: {
          title: "Services",
          links: {
            residential: "Residential",
            commercial: "Commercial",
            interior: "Interior Design",
            renovations: "Renovations"
          }
        }
      },
      copyright: "© 2024 ADM Instal. All rights reserved."
    },
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      contact: "Contact",
    },
    about: {
      title: "About Us",
      subtitle: "Your trusted partner in construction",
      description: "With years of experience and a team of skilled professionals, we deliver high-quality construction and aggregate services tailored to your needs.",
      stats: {
        projects: "Completed Projects",
        clients: "Happy Clients",
        experience: "Years Experience",
      },
    },
    process: {
      title: "How We Work",
      subtitle: "Our proven four-step process ensures every project is delivered on time, within budget, and to the highest quality standards.",
      steps: {
        consultation: {
          title: "Initial Consultation",
          description: "We meet with you to understand your vision, requirements, and budget constraints."
        },
        planning: {
          title: "Design & Planning",
          description: "Our team creates detailed plans and designs tailored to your specific needs."
        },
        execution: {
          title: "Project Execution",
          description: "We execute the project with precision, maintaining quality and timeline standards."
        },
        delivery: {
          title: "Final Delivery",
          description: "We deliver your completed project and provide ongoing support and maintenance."
        }
      }
    },
    projects: {
      title: "Featured Projects",
      subtitle: "Our Work",
      description: "Showcasing our commitment to excellence through successful project deliveries across various sectors.",
      items: {
        office: {
          title: "Downtown Office Complex",
          category: "Commercial",
          description: "50,000 sq ft modern office building with sustainable design features.",
          specs: [
            "LEED Gold Certified",
            "6-Month Timeline",
            "$2.5M Project Value"
          ]
        },
        residential: {
          title: "Luxury Residential Estate",
          category: "Residential",
          description: "Custom 8,000 sq ft home with premium finishes and smart home integration.",
          specs: [
            "Smart Home Technology",
            "Premium Materials",
            "Award-Winning Design"
          ]
        },
        retail: {
          title: "Retail Shopping Center",
          category: "Commercial",
          description: "Mixed-use development with retail spaces and parking facilities.",
          specs: [
            "Multi-Phase Construction",
            "On-Time Delivery",
            "Tenant Ready"
          ]
        }
      }
    },
    testimonials: {
      title: "What Our Clients Say",
      subtitle: "Client Testimonials",
      items: {
        techCorp: {
          quote: "ADM Instal transformed our office space beyond our expectations. Their attention to detail and professionalism throughout the project was exceptional.",
          author: "Sarah Mitchell",
          position: "CEO",
          company: "TechCorp Solutions"
        },
        chenDev: {
          quote: "The team at ADM Instal delivered our residential project on time and within budget. The quality of workmanship is outstanding.",
          author: "Michael Chen",
          position: "Property Developer",
          company: "Chen Development Group"
        },
        metroProps: {
          quote: "Professional, reliable, and skilled. ADM Instal has been our go-to construction partner for multiple commercial projects.",
          author: "Jennifer Rodriguez",
          position: "Operations Director",
          company: "Metro Properties"
        }
      }
    },
  }
} 