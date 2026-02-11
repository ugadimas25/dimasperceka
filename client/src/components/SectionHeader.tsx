import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  number: string;
}

export function SectionHeader({ title, subtitle, number }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12 md:mb-20"
    >
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-primary text-xl font-bold">{number}.</span>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
          {title}
        </h2>
        <div className="h-[1px] bg-border flex-grow max-w-[200px] ml-4 hidden md:block" />
      </div>
      <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    </motion.div>
  );
}
