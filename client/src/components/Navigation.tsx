import { useState, useEffect } from "react";
import { Link as ScrollLink } from "react-scroll";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Map } from "lucide-react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { name: "About", to: "about" },
    { name: "Experience", to: "experience" },
    { name: "Skills", to: "skills" },
    { name: "Projects", to: "projects" },
    { name: "Contact", to: "contact" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50 py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        {/* Logo */}
        <ScrollLink
          to="hero"
          smooth={true}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative">
            <Globe className="w-8 h-8 text-primary animate-pulse-slow" />
            <Map className="w-4 h-4 text-secondary absolute -bottom-1 -right-1" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-none tracking-wide text-white group-hover:text-primary transition-colors">
              DIMAS PERCEKA
            </span>
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
              GIS SPECIALIST
            </span>
          </div>
        </ScrollLink>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <ScrollLink
              key={link.name}
              to={link.to}
              spy={true}
              smooth={true}
              offset={-100}
              className="font-mono text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors relative group"
            >
              <span className="text-primary/50 mr-1 text-xs">0{links.indexOf(link) + 1}.</span>
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </ScrollLink>
          ))}
          <a
            href="/assets/CV.pdf"
            target="_blank"
            className="px-5 py-2 rounded-full border border-primary/50 text-primary font-medium hover:bg-primary/10 transition-all text-sm"
          >
            Resume
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
              {links.map((link) => (
                <ScrollLink
                  key={link.name}
                  to={link.to}
                  smooth={true}
                  offset={-100}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-display text-foreground/80 hover:text-primary cursor-pointer"
                >
                  <span className="text-primary font-mono text-sm mr-2">0{links.indexOf(link) + 1}.</span>
                  {link.name}
                </ScrollLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
