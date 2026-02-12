import { useEffect, lazy, Suspense, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink } from "wouter";
import { ChevronDown, ExternalLink, Mail, Github, Linkedin, Map as MapIcon, Database, Code2, Globe2, Layers, Leaf, BookOpen, ArrowUpRight, FileText, ChevronRight, Building2, Calendar, MapPin, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { SectionHeader } from "@/components/SectionHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { useProjects, useExperiences, useEducations, useSendMessage } from "@/hooks/use-portfolio";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, type InsertMessage } from "@shared/schema";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { Button } from "@/components/ui/button";

// Hero Map Background Component
function MapBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />
        {/* Abstract Topo Lines */}
        <motion.path
          d="M0 50 Q 25 30, 50 50 T 100 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.2"
          className="text-secondary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <motion.path
          d="M0 70 Q 25 50, 50 70 T 100 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.2"
          className="text-primary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut", delay: 1 }}
        />
      </svg>
    </div>
  );
}

// ── Project Work Card (navigates to full page) ─────────────────────────────

function WorkCard({
  index,
  badge,
  title,
  summary,
  techStack,
  href,
}: {
  index: number;
  badge: string;
  title: string;
  summary: string;
  techStack: string[];
  href: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-6"
    >
      <RouterLink href={href}>
        <div className="w-full text-left group transition-all rounded-xl border overflow-hidden bg-card/30 border-white/5 hover:border-primary/30 hover:bg-card/50 cursor-pointer">
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-primary text-xs">{badge}</span>
                  <div className="h-[1px] bg-border flex-grow max-w-[60px]" />
                </div>
                <h3 className="font-display text-lg md:text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 max-w-2xl">
                  {summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {techStack.slice(0, 5).map(tech => (
                    <span key={tech} className="text-[10px] font-mono text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15">
                      {tech}
                    </span>
                  ))}
                  {techStack.length > 5 && (
                    <span className="text-[10px] font-mono text-muted-foreground">+{techStack.length - 5} more</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 mt-1 p-2 rounded-lg border transition-all bg-muted/30 border-border/30 text-muted-foreground group-hover:text-primary group-hover:border-primary/30">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </RouterLink>
    </motion.div>
  );
}

// ── Expandable Project Card (for DB projects without a dedicated page) ──────

function ExpandableWork({
  index,
  badge,
  title,
  summary,
  techStack,
  defaultExpanded,
  children,
}: {
  index: number;
  badge: string;
  title: string;
  summary: string;
  techStack: string[];
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left group transition-all rounded-xl border overflow-hidden ${
          expanded
            ? "bg-card/60 border-primary/30 shadow-lg shadow-primary/5"
            : "bg-card/30 border-white/5 hover:border-primary/20 hover:bg-card/50"
        }`}
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-primary text-xs">{badge}</span>
                <div className="h-[1px] bg-border flex-grow max-w-[60px]" />
              </div>
              <h3 className="font-display text-lg md:text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 max-w-2xl">
                {summary}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {techStack.slice(0, 5).map(tech => (
                  <span key={tech} className="text-[10px] font-mono text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15">
                    {tech}
                  </span>
                ))}
                {techStack.length > 5 && (
                  <span className="text-[10px] font-mono text-muted-foreground">+{techStack.length - 5} more</span>
                )}
              </div>
            </div>

            <div className={`shrink-0 mt-1 p-2 rounded-lg border transition-all ${
              expanded
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/30 border-border/30 text-muted-foreground group-hover:text-primary group-hover:border-primary/30"
            }`}>
              <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-6 pt-2 bg-card/40 border-x border-b border-primary/20 rounded-b-xl">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Home() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: experiences, isLoading: expLoading } = useExperiences();
  const { data: educations, isLoading: eduLoading } = useEducations();
  
  const { toast } = useToast();
  const sendMessage = useSendMessage();

  const form = useForm<InsertMessage>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: { name: "", email: "", message: "" }
  });

  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (data: InsertMessage) => {
    setIsSending(true);
    try {
      // Send via EmailJS
      await emailjs.send(
        "service_8vvi6bk",
        "template_y8h0tz8",
        {
          from_name: data.name,
          from_email: data.email,
          message: data.message,
        },
        "f3guQ1_2BbPuikway"
      );
      // Also save to server
      sendMessage.mutate(data);
      toast({ title: "Message Sent!", description: "I'll get back to you soon." });
      form.reset();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to send message. Try again." });
    } finally {
      setIsSending(false);
    }
  };

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navigation />
      
      {/* === HERO SECTION === */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <MapBackground />
        
        <div className="container px-4 z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <span className="font-mono text-primary mb-4 block tracking-widest text-sm">
              HELLO, WORLD
            </span>
            <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl mb-6 tracking-tight leading-none">
              Dimas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-secondary">Perceka</span>
            </h1>
            <h2 className="font-sans text-xl md:text-3xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              GIS Specialist & Remote Sensing Expert bridging the gap between <span className="text-secondary font-medium">Data</span>, <span className="text-primary font-medium">Technology</span>, and <span className="text-accent font-medium">Sustainability</span>.
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <ScrollLink to="projects" smooth={true} offset={-100}>
                <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-lg h-14 px-8 shadow-lg shadow-primary/25">
                  View My Work
                </Button>
              </ScrollLink>
              <ScrollLink to="contact" smooth={true} offset={-100}>
                <Button variant="outline" size="lg" className="rounded-full border-primary/50 text-primary hover:bg-primary/10 font-mono text-lg h-14 px-8">
                  Get In Touch
                </Button>
              </ScrollLink>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-mono tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* === ABOUT SECTION === */}
      <section id="about" className="py-24 md:py-32 relative">
        <div className="container px-4 mx-auto">
          <SectionHeader 
            number="01" 
            title="About Me" 
            subtitle="Leading technical and engineering teams to deliver innovative geospatial solutions at scale." 
          />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-lg prose-invert text-muted-foreground">
              <p>
                As a <strong className="text-primary">Technical Lead</strong> with over 8 years of experience, I architect and deliver enterprise-level geospatial solutions that drive environmental impact. I lead cross-functional teams in building scalable systems for remote sensing, spatial data infrastructure, and climate analytics.
              </p>
              <p>
                Currently serving as <strong className="text-primary">Geospatial Lead</strong>, I bridge the gap between technical execution and strategic vision—translating complex requirements into robust architectures, guiding engineering best practices, and mentoring teams to deliver production-ready solutions for sustainable agriculture, forestry, and carbon monitoring.
              </p>
              <ul className="grid grid-cols-2 gap-4 mt-8 font-mono text-sm text-foreground not-prose">
                <li className="flex items-center gap-2"><Users className="text-primary w-4 h-4"/> Team Leadership</li>
                <li className="flex items-center gap-2"><Code2 className="text-primary w-4 h-4"/> Technical Architecture</li>
                <li className="flex items-center gap-2"><MapIcon className="text-primary w-4 h-4"/> Geospatial Systems</li>
                <li className="flex items-center gap-2"><Leaf className="text-primary w-4 h-4"/> Climate Solutions</li>
              </ul>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 border-2 border-primary/20 rounded-2xl z-0 group-hover:border-primary/50 transition-colors" />
              <div className="relative z-10 bg-card rounded-xl overflow-hidden aspect-square max-w-sm mx-auto shadow-2xl">
                 {/* Profile Photo */}
                 <img 
                   src="/profile_photo.png" 
                   alt="Profile" 
                   className="w-full h-full object-cover transition-all duration-500"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="font-display font-bold text-xl text-white">Dimas Perceka</h3>
                      <p className="text-primary font-mono text-sm">Indonesia based</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === EXPERIENCE SECTION === */}
      <section id="experience" className="py-24 md:py-32 bg-muted/20 relative">
        <div className="container px-4 mx-auto">
          <SectionHeader 
            number="02" 
            title="Where I've Worked" 
            subtitle="A journey through impactful organizations and challenging projects." 
          />
          
          <div className="mt-16 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
            <div className="flex gap-4 min-w-max">
              {expLoading ? (
                <div className="text-center font-mono text-muted-foreground">Loading...</div>
              ) : (
                experiences?.map((exp, idx) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="w-[320px] shrink-0 bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 text-secondary font-medium text-sm mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{exp.company}</span>
                    </div>
                    <h3 className="text-base font-bold font-display text-foreground group-hover:text-primary transition-colors mb-2">
                      {exp.role}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-mono mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exp.duration}
                      </span>
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {exp.location}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                      {exp.description}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* === SELECTED WORKS SECTION === */}
      <section id="projects" className="py-24 md:py-32 relative">
        <div className="container px-4 mx-auto">
          <SectionHeader 
            number="03" 
            title="Selected Works" 
            subtitle="Projects that demonstrate technical capability and real-world impact. Click to expand." 
          />
          
          {/* === FEATURED: GEE Flood Analysis === */}
          <WorkCard
            index={0}
            badge="Featured Project"
            title="Operational Flood & Disaster Analysis"
            summary="Real satellite-based flood hazard, landslide detection, and agricultural commodity impact analysis powered by Google Earth Engine with Sentinel-1 SAR & Sentinel-2 imagery."
            techStack={["Google Earth Engine", "Sentinel-1 SAR", "Sentinel-2", "Flood Mapping", "Landslide Detection", "Commodity Analysis", "MapLibre GL"]}
            href="/project/flood-analysis"
          />

          {/* === FEATURED #2: GeoGPT Analyst === */}
          <WorkCard
            index={1}
            badge="Featured Project"
            title="GeoGPT Analyst — AI Geospatial Query System"
            summary="Natural language geospatial query system powered by OpenAI GPT-4o function calling with Turf.js spatial operations. Analyze plantation overlaps, deforestation alerts, EUDR compliance, and commodity distribution through conversational AI."
            techStack={["OpenAI GPT-4o", "Function Calling", "Turf.js", "Leaflet", "EUDR Compliance", "GFW Integration", "PostGIS", "Bilingual AI"]}
            href="/project/geogpt"
          />

          {/* === FEATURED #3: Supplychain Emission === */}
          <WorkCard
            index={2}
            badge="Featured Project"
            title="Supplychain Emission — Carbon Traceability Platform"
            summary="Interactive supply chain traceability map integrated with CoolFarmTool carbon emission analysis. Visualize commodity flows from producers to warehouses with per-actor CO₂eq breakdown, emission heatmaps, and GHG gas composition charts."
            techStack={["MapLibre GL", "CoolFarmTool", "Recharts", "Supply Chain", "GHG Protocol", "PostgreSQL", "GeoServer WMS", "CO₂eq Analysis"]}
            href="/project/supplychain-emission"
          />

          {/* === FEATURED #4: Digital Twin Climate === */}
          <WorkCard
            index={3}
            badge="Featured Project"
            title="Climate-Smart Digital Twin — Agricultural Monitoring"
            summary="Real-time agricultural field monitoring platform with AI-powered climate risk assessment. Track vegetation health (NDVI), water stress, flood risk, and temperature anomalies across field polygons with automated alert system for high-risk conditions."
            techStack={["MapLibre GL", "Digital Twin", "NDVI", "Climate Analytics", "Risk Assessment", "Real-time Alerts", "Field Monitoring", "WebSocket"]}
            href="/project/digital-twin-climate"
          />

          {/* Other Projects */}
          <div className="mt-8">
            {projectsLoading ? (
              <div className="text-center font-mono">Loading projects...</div>
            ) : (
              projects?.filter(p => p.title !== "3D Flood Impact Visualization").map((project, idx) => (
                <ExpandableWork
                  key={project.id}
                  index={idx + 1}
                  badge="Project"
                  title={project.title}
                  summary={project.description}
                  techStack={project.techStack || []}
                  defaultExpanded={false}
                >
                  <ProjectCard project={project} index={idx} />
                </ExpandableWork>
              ))
            )}
          </div>
        </div>
      </section>

      {/* === ARTICLES SECTION === */}
      <section id="articles" className="py-24 md:py-32 bg-muted/20 relative">
        <div className="container px-4 mx-auto">
          <SectionHeader 
            number="04" 
            title="Articles & Publications" 
            subtitle="Research and writings related to GIS, remote sensing, and sustainability." 
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {[
              {
                title: "KOLTIVA Closes the Gap Toward EUDR-Ready Supply Chains",
                description: "Only 4% of Global Timber Firms Can Trace Their Wood to Forest Origins. Featured as Remote Sensing and Climate Lead, Subject Matter Expert on traceability and EUDR compliance solutions.",
                tags: ["EUDR", "Supply Chain", "Remote Sensing"],
                type: "Article",
                year: "2024",
                url: "https://www.koltiva.com/post/koltiva-closes-the-gap-toward-eudr-ready-supply-chains"
              },
              {
                title: "Can You Afford to Ignore Geospatial Data in the Race for EUDR Compliance?",
                description: "Expert insights on the critical role of geospatial data in achieving EUDR compliance. Contributed as Subject Matter Expert, Remote Sensing & Climate Lead.",
                tags: ["EUDR", "Geospatial Data", "Compliance"],
                type: "Article",
                year: "2024",
                url: "https://www.koltiva.com/post/can-you-afford-to-ignore-geospatial-data-in-the-race-for-eudr-compliance"
              },
              {
                title: "Geolocation Data & GIS Expert for Deforestation Monitoring",
                description: "Interview featuring Koltiva's GIS expert discussing geolocation data barriers in deforestation monitoring and supply chain transparency for sustainable agriculture.",
                tags: ["GIS", "Deforestation", "Interview"],
                type: "Interview",
                year: "2024",
                url: "https://www.koltiva.com/post/post-geolocation-data-gis-expert-for-deforestation-monitoring-and-supply-chain-transparency"
              },
              {
                title: "Hyperspectral Thermal Image Unmixing",
                description: "Completed advanced certification from GIS and Earth Observation University on hyperspectral thermal image unmixing techniques for remote sensing applications.",
                tags: ["Hyperspectral", "Thermal Imaging", "Remote Sensing"],
                type: "Certificate",
                year: "2025",
                url: "https://www.geo.university/certificates/inxso0zkbk"
              },
              {
                title: "Spatial Web-Based Agricultural Irrigation Management Information System",
                description: "Master's thesis research on developing an innovative spatial-based system to optimize irrigation management using web GIS technologies.",
                tags: ["Web GIS", "Irrigation", "Spatial Analysis"],
                type: "Thesis",
                year: "2021",
                url: ""
              },
              {
                title: "IEEE Research - Land Cover Classification with Self Supervised Algorithm",
                description: "Published IEEE research on land cover classification leveraging self-supervised learning algorithms for improved accuracy in remote sensing image analysis without extensive labeled training data.",
                tags: ["IEEE", "Self-Supervised Learning", "Land Cover Classification"],
                type: "Research",
                year: "2022",
                url: "https://www.semanticscholar.org/paper/Land-Cover-Classification-with-Self-Supervised-Purba-Perceka/8893dc17922a5e413885223245a8a907774275f8"
              },
              {
                title: "Labile and Stable Fraction of Carbon in Different Land Use",
                description: "Bachelor's thesis investigating soil carbon fractions across different land use types, providing insights into carbon sequestration potential.",
                tags: ["Soil Science", "Carbon", "Land Use"],
                type: "Thesis",
                year: "2012",
                url: ""
              },
            ].map((article, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => article.url && window.open(article.url, '_blank')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-xs font-mono text-primary/60">{article.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{article.year}</span>
                    {article.url && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
                
                <h4 className="font-display font-bold text-lg text-foreground mb-3 group-hover:text-primary transition-colors leading-tight">
                  {article.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {article.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-mono text-secondary/80 bg-secondary/10 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === CONTACT SECTION === */}
      <section id="contact" className="py-24 md:py-32 bg-gradient-to-b from-background to-black relative">
        <div className="container px-4 mx-auto max-w-4xl text-center">
          <span className="font-mono text-primary mb-4 block">05. What's Next?</span>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6">
            Get In Touch
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
            Although I'm not currently looking for any new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I'll try my best to get back to you!
          </p>

          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="space-y-8">
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-primary/10 rounded-lg text-primary">
                   <Mail className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-lg mb-1">Email Me</h4>
                   <a href="mailto:ugadimas@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">ugadimas@gmail.com</a>
                 </div>
               </div>
               
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                   <Linkedin className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-lg mb-1">LinkedIn</h4>
                   <a href="https://www.linkedin.com/in/dimas-uga/" target="_blank" className="text-muted-foreground hover:text-secondary transition-colors">Connect professionally</a>
                 </div>
               </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <input
                    {...form.register("name")}
                    placeholder="Name"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  />
                  {form.formState.errors.name && <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <input
                    {...form.register("email")}
                    placeholder="Email"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                  />
                  {form.formState.errors.email && <p className="text-red-400 text-xs">{form.formState.errors.email.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <textarea
                  {...form.register("message")}
                  placeholder="Your Message"
                  rows={4}
                  className="w-full bg-muted/30 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
                {form.formState.errors.message && <p className="text-red-400 text-xs">{form.formState.errors.message.message}</p>}
              </div>
              
              <Button 
                type="submit" 
                disabled={isSending}
                className="w-full bg-primary text-primary-foreground font-bold py-3 h-auto rounded-lg hover:bg-primary/90 transition-all"
              >
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground font-mono text-sm border-t border-white/5">
        <p>Designed & Built by Dimas Perceka</p>
        <p className="opacity-50 mt-2">© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
