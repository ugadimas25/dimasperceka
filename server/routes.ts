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
      description: "Leading remote sensing projects for environmental and FTTH monitoring. Integrating LiDAR, satellite imagery, and land-use datasets for supply chain transparency. Managing GIS developers and environmental scientists.",
      order: 1
    });
    await storage.createExperience({
      company: "World Resources Institute (WRI)",
      role: "GIS Developer",
      duration: "Mar 2019 - Jan 2021",
      location: "Jakarta, Indonesia",
      description: "Translated business needs to technical requirements. Developed and deployed automated prioritization scripts. Coordinated with sustainable commodities researchers.",
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
    await storage.createExperience({
      company: "Center of Agroecology and Land Resources",
      role: "GIS Developer",
      duration: "Mar 2017 - Jan 2019",
      location: "Yogyakarta",
      description: "Worked on connectivity of protected areas and peat ecosystem cultivation. Designed and created geospatial databases.",
      order: 4
    });
    await storage.createExperience({
      company: "Waindo Specterra",
      role: "GIS Specialist",
      duration: "July 2016 - Feb 2017",
      location: "",
      description: "Surveyed soil characteristics for Land System in East and South Kalimantan. Performed data capture and analysis.",
      order: 5
    });
    await storage.createExperience({
      company: "Agricola Nusantara Baramineral",
      role: "GIS Specialist",
      duration: "Jan 2016 - July 2016",
      location: "",
      description: "Feasibility study on Industrial Scale Vaname Shrimp Farming. Managed geospatial database and developed maps.",
      order: 6
    });

    // Education
    await storage.createEducation({
      institution: "Universitas Gadjah Mada",
      degree: "Master of Engineering, Geomatics Engineering",
      year: "2018 - 2021",
      description: "Thesis: Development of Spatial Web Based Agricultural Irrigation Management Information System",
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
      { name: "ArcGIS Pro", category: "GIS Software" },
      { name: "QGIS", category: "GIS Software" },
      { name: "ENVI / ENVI LiDAR", category: "Remote Sensing" },
      { name: "Google Earth Engine", category: "Cloud Processing" },
      { name: "Python", category: "Programming" },
      { name: "PostgreSQL", category: "Database" },
      { name: "SQL", category: "Database" },
      { name: "Javascript", category: "Programming" },
      { name: "PHP", category: "Programming" },
      { name: "Agisoft Metashape", category: "3D Modelling" },
    ];

    for (const s of skillList) {
      await storage.createSkill(s);
    }

    // Projects (Derived from Experience/CV context)
    await storage.createProject({
      title: "Deforestation-free Supply Chain Monitoring",
      description: "Developed and managed geospatial projects to track deforestation risk commodities like palm oil and cocoa. Integrated satellite imagery with sustainability models.",
      role: "Lead",
      techStack: ["Remote Sensing", "GIS", "Python"],
      order: 1
    });
    await storage.createProject({
      title: "Spatial Web Irrigation Management System",
      description: "Master's Thesis project: Development of a web-based information system for agricultural irrigation management.",
      role: "Developer/Researcher",
      techStack: ["Web GIS", "Database"],
      order: 2
    });
    await storage.createProject({
      title: "Peat Ecosystem Connectivity",
      description: "Project for Connectivity of Protected Areas and Peat Ecosystem Cultivation in Central Kalimantan.",
      role: "GIS Developer",
      techStack: ["GIS", "Spatial Analysis"],
      order: 3
    });
  }
}
