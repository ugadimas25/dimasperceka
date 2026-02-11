import { motion } from "framer-motion";
import { MapPin, Calendar, Building2 } from "lucide-react";
import type { Experience } from "@shared/schema";

export function ExperienceCard({ experience, index }: { experience: Experience; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-8 md:pl-0"
    >
      {/* Timeline Line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border md:left-1/2 md:-ml-px" />
      
      {/* Timeline Dot */}
      <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-primary ring-4 ring-background md:left-1/2 md:-ml-1" />

      <div className={`md:flex justify-between items-start gap-12 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
        <div className="md:w-1/2 mb-8 md:mb-0" />
        
        <div className={`md:w-1/2 ${index % 2 === 0 ? "md:pl-12" : "md:pr-12 md:text-right"}`}>
          <div className="glass-card p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-300 group">
            <header className={`mb-4 ${index % 2 !== 0 ? "md:flex md:flex-col md:items-end" : ""}`}>
              <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                {experience.role}
              </h3>
              <div className="flex items-center gap-2 text-secondary font-medium mt-1">
                <Building2 className="w-4 h-4" />
                <span>{experience.company}</span>
              </div>
              <div className={`flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground font-mono ${index % 2 !== 0 ? "md:justify-end" : ""}`}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {experience.duration}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {experience.location}
                </span>
              </div>
            </header>
            
            <p className="text-muted-foreground text-sm leading-relaxed">
              {experience.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
