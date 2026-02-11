import { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import { ChevronDown, ExternalLink, Mail, Github, Linkedin, Map as MapIcon, Database, Code2, Globe2, Layers, Leaf } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { SectionHeader } from "@/components/SectionHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { ExperienceCard } from "@/components/ExperienceCard";
import { useProjects, useExperiences, useSkills, useEducations, useSendMessage } from "@/hooks/use-portfolio";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema, type InsertMessage } from "@shared/schema";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
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

export default function Home() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const { data: experiences, isLoading: expLoading } = useExperiences();
  const { data: educations, isLoading: eduLoading } = useEducations();
  
  const { toast } = useToast();
  const sendMessage = useSendMessage();

  const form = useForm<InsertMessage>({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: { name: "", email: "", message: "" }
  });

  const onSubmit = (data: InsertMessage) => {
    sendMessage.mutate(data, {
      onSuccess: () => {
        toast({ title: "Message Sent!", description: "I'll get back to you soon." });
        form.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to send message. Try again." });
      }
    });
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
            subtitle="I transform complex spatial data into actionable insights for a sustainable future." 
          />
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="prose prose-lg prose-invert text-muted-foreground">
              <p>
                With over 8 years of experience in GIS and Remote Sensing, I specialize in applying geospatial technology to solve environmental challenges. My work focuses on sustainable agriculture, forestry, and climate change mitigation.
              </p>
              <p>
                Currently, I leverage satellite imagery, drone data, and advanced spatial analysis to support decision-making in agroecology. I combine technical expertise with a deep passion for environmental stewardship.
              </p>
              <ul className="grid grid-cols-2 gap-4 mt-8 font-mono text-sm text-foreground not-prose">
                <li className="flex items-center gap-2"><MapIcon className="text-primary w-4 h-4"/> Spatial Analysis</li>
                <li className="flex items-center gap-2"><Globe2 className="text-primary w-4 h-4"/> Remote Sensing</li>
                <li className="flex items-center gap-2"><Database className="text-primary w-4 h-4"/> Data Management</li>
                <li className="flex items-center gap-2"><Leaf className="text-primary w-4 h-4"/> Sustainability</li>
              </ul>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 border-2 border-primary/20 rounded-2xl z-0 group-hover:border-primary/50 transition-colors" />
              <div className="relative z-10 bg-card rounded-xl overflow-hidden aspect-square max-w-sm mx-auto shadow-2xl">
                 {/* Unsplash professional portrait placeholder */}
                 {/* Man working with maps/tech */}
                 <img 
                   src="https://images.unsplash.com/photo-1553877616-15236ed36545?auto=format&fit=crop&q=80&w=800" 
                   alt="Profile" 
                   className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
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
          
          <div className="max-w-3xl mx-auto mt-16 relative space-y-12">
            {expLoading ? (
              <div className="text-center font-mono text-muted-foreground">Loading timeline...</div>
            ) : (
              experiences?.map((exp, idx) => (
                <ExperienceCard key={exp.id} experience={exp} index={idx} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* === SKILLS SECTION === */}
      <section id="skills" className="py-24 md:py-32 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 pointer-events-none" />
        
        <div className="container px-4 mx-auto relative z-10">
          <SectionHeader 
            number="03" 
            title="Technical Arsenal" 
            subtitle="Tools and technologies I use to map the world." 
          />
          
          {skillsLoading ? (
            <div className="text-center font-mono">Loading skills...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Group by category manually or just render generic cards */}
              {['GIS Software', 'Programming', 'Remote Sensing'].map((category) => {
                 const categorySkills = skills?.filter(s => s.category === category) || [];
                 if (categorySkills.length === 0) return null;

                 return (
                   <motion.div 
                     key={category}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     className="bg-card/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all"
                   >
                      <div className="flex items-center gap-3 mb-6">
                        {category === 'GIS Software' && <Layers className="text-primary w-6 h-6" />}
                        {category === 'Programming' && <Code2 className="text-accent w-6 h-6" />}
                        {category === 'Remote Sensing' && <Globe2 className="text-secondary w-6 h-6" />}
                        <h3 className="font-display text-xl font-bold">{category}</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {categorySkills.map(skill => (
                          <div key={skill.id} className="group">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-foreground">{skill.name}</span>
                              <span className="font-mono text-primary/60">{skill.proficiency}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${skill.proficiency}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  category === 'GIS Software' ? 'bg-primary' :
                                  category === 'Programming' ? 'bg-accent' : 'bg-secondary'
                                }`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                   </motion.div>
                 );
              })}
            </div>
          )}
        </div>
      </section>

      {/* === PROJECTS SECTION === */}
      <section id="projects" className="py-24 md:py-32 relative">
        <div className="container px-4 mx-auto">
          <SectionHeader 
            number="04" 
            title="Selected Works" 
            subtitle="Projects that demonstrate technical capability and environmental impact." 
          />
          
          <div className="mt-16">
            {projectsLoading ? (
              <div className="text-center font-mono">Loading projects...</div>
            ) : (
              projects?.map((project, idx) => (
                <ProjectCard key={project.id} project={project} index={idx} />
              ))
            )}
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
                   <a href="mailto:dimasperceka@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">dimasperceka@gmail.com</a>
                 </div>
               </div>
               
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                   <Linkedin className="w-6 h-6" />
                 </div>
                 <div>
                   <h4 className="font-bold text-lg mb-1">LinkedIn</h4>
                   <a href="https://linkedin.com" target="_blank" className="text-muted-foreground hover:text-secondary transition-colors">Connect professionally</a>
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
                disabled={sendMessage.isPending}
                className="w-full bg-primary text-primary-foreground font-bold py-3 h-auto rounded-lg hover:bg-primary/90 transition-all"
              >
                {sendMessage.isPending ? "Sending..." : "Send Message"}
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
