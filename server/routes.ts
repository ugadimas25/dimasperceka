import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Projects
  app.get(api.projects.list.path, async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  // Skills
  app.get(api.skills.list.path, async (_req, res) => {
    const skills = await storage.getSkills();
    res.json(skills);
  });

  // Experiences
  app.get(api.experiences.list.path, async (_req, res) => {
    const experiences = await storage.getExperiences();
    res.json(experiences);
  });

  // Educations
  app.get(api.educations.list.path, async (_req, res) => {
    const educations = await storage.getEducations();
    res.json(educations);
  });

  // Testimonies
  app.get(api.testimonies.list.path, async (_req, res) => {
    const testimonies = await storage.getTestimonies();
    res.json(testimonies);
  });

  // Contact
  app.post(api.contact.submit.path, async (req, res) => {
    try {
      const input = api.contact.submit.input.parse(req.body);
      await storage.createMessage(input);
      res.json({ success: true, message: "Message received" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid input", 
          field: err.errors[0].path.join('.') 
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const experiences = await storage.getExperiences();
  if (experiences.length === 0) {
    // Experience
    await storage.createExperience({
      company: "Koltiva AG",
      role: "Remote Sensing and Climate Lead",
      duration: "Jan 2022 - Present",
      location: "Jakarta, Indonesia",
      description: "Leading remote sensing and climate projects to support climate change analysis and environmental monitoring. Collaborating with cross-functional teams to design and implement innovative climate solutions, integrating remote sensing data with climate models to assess and predict environmental impacts.",
      order: 1
    });
    await storage.createExperience({
      company: "World Resources Institute (WRI)",
      role: "GIS Developer",
      duration: "Mar 2019 - Jan 2021",
      location: "Jakarta, Indonesia",
      description: "Translated business needs into technical requirements and specifications. Developed and deployed automated prioritization scripts and participated in the design, development, and implementation of complex geospatial applications.",
      order: 2
    });
    await storage.createExperience({
      company: "CV Amanah Rimba",
      role: "GIS Consultant",
      duration: "Mar 2019 - Jan 2021",
      location: "Indonesia",
      description: "Managed geospatial databases, developed maps, and performed aerial photogrammetry for technical feasibility studies.",
      order: 3
    });

    // Education
    await storage.createEducation({
      institution: "Universitas Gadjah Mada",
      degree: "Master of Engineering, Geomatics Engineering",
      year: "2018 - 2021",
      description: "Thesis: Development of Spatial Web Based Agricultural Irrigation Management Information System. Focused on creating an innovative spatial-based system to optimize irrigation management.",
      order: 1
    });
    await storage.createEducation({
      institution: "Universitas Gadjah Mada",
      degree: "Bachelor Degree, Soil Science",
      year: "2012",
      description: "Thesis: Labile and Stable Fraction of Carbon in Different Landuse",
      order: 2
    });

    // Skills
    const skillList = [
      { name: "Remote Sensing", category: "Core Expertise" },
      { name: "Data Science", category: "Core Expertise" },
      { name: "Web Development", category: "Core Expertise" },
      { name: "ArcGIS Pro", category: "GIS Software" },
      { name: "Python", category: "Programming" },
      { name: "Javascript", category: "Programming" },
      { name: "PostgreSQL", category: "Database" },
      { name: "Google Earth Engine", category: "Cloud Processing" },
    ];

    for (const s of skillList) {
      await storage.createSkill(s);
    }

    // Testimonies
    await storage.createTestimony({
      name: "Didi Adisaputro, PhD",
      role: "Sr Head of Geospatial Climate and IoT at Koltiva",
      content: "Dimas demonstrates a rare combination of technical skill and strategic thinking. His ability to integrate data science and geospatial technology has consistently delivered impactful results."
    });

    // Projects (From portfolio-dimas-omega.vercel.app/work.html)
    await storage.createProject({
      title: "Deforestation Analysis",
      description: "Conducted comprehensive deforestation analysis using satellite imagery to monitor and assess forest cover changes over time.",
      role: "GIS Specialist",
      techStack: ["Remote Sensing", "Satellite Imagery", "GIS"],
      link: "https://portfolio-dimas-omega.vercel.app/port_1_deforestation_analysis/webmap.html",
      order: 1
    });
    await storage.createProject({
      title: "Autocorrection Polygon",
      description: "Designed and developed an interactive geospatial platform for environmental analysis and decision-making.",
      role: "GIS Developer",
      techStack: ["Web GIS", "Interactive Platform", "Javascript"],
      link: "https://portfolio-dimas-omega.vercel.app/port_2_polygon_verification/polygon-detail.html",
      order: 2
    });
    await storage.createProject({
      title: "Carbon Stock Analysis",
      description: "Led the integration of remote sensing data with climate models to assess and predict environmental impacts.",
      role: "Climate Lead",
      techStack: ["Climate Models", "Remote Sensing", "Data Integration"],
      link: "https://portfolio-dimas-omega.vercel.app/port_3_Carbon%20Stock%20Analysis/index.html",
      order: 3
    });
    await storage.createProject({
      title: "Emission Dashboard",
      description: "Automated workflows for geospatial data processing and analysis using Python and cloud-based solutions.",
      role: "Data Scientist",
      techStack: ["Python", "Cloud Solutions", "Dashboard"],
      link: "https://portfolio-dimas-omega.vercel.app/port_4_ghg_dashboard/index.html",
      order: 4
    });
  }
}
