import { motion } from "framer-motion";
import { ExternalLink, Github, ArrowUpRight } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col md:flex-row gap-8 items-center mb-24 md:mb-32 ${
        !isEven ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Image Side */}
      <div className="w-full md:w-3/5 group relative">
        <div className="absolute inset-0 bg-primary/20 rounded-xl transform translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
        <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-2xl aspect-video group-hover:border-primary/50 transition-colors">
          <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors z-10" />
          
          {/* Use Unsplash if image URL is missing or generic */}
          {/* Project screenshot */}
          <img
            src={project.imageUrl || `https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600`}
            alt={project.title}
            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105"
          />
        </div>
      </div>

      {/* Content Side */}
      <div className={`w-full md:w-2/5 flex flex-col ${!isEven ? "md:items-end md:text-right" : "md:items-start text-left"}`}>
        <span className="font-mono text-primary text-sm mb-2">Featured Project</span>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        
        <div className={`p-6 bg-card/50 backdrop-blur-sm border border-white/5 rounded-lg shadow-xl mb-6 text-muted-foreground relative z-20 ${!isEven ? "md:-mr-20" : "md:-ml-20"}`}>
          <p>{project.description}</p>
        </div>

        <div className={`flex flex-wrap gap-3 mb-6 ${!isEven ? "justify-end" : "justify-start"}`}>
          {project.techStack?.map((tech) => (
            <span key={tech} className="text-xs font-mono text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {tech}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <span className="font-mono text-sm">View Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
