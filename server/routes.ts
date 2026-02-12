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
      description: "Work directly with Product Owners to translate business needs to technical requirements and specifications. Work closely with stakeholders and provide the deliverables with high quality of standards. Develop, test, and deploy automated prioritization script. Participates in the design, development and implementation of complex applications. As needed, coordinated with existing team of sustainable commodities researchers.",
      order: 2
    });
    await storage.createExperience({
      company: "CV Amanah Rimba",
      role: "GIS Consultan",
      duration: "Mar 2019 - Jan 2021",
      location: "Indonesia",
      description: "Project for Technical Feasibility Study. Manage geospatial database and develop maps and aerial photogrammetry. Perform data capture and analysis for GIS product. Support in designing and creating the geospatial database. Oversee data flow, management, and distribution activities to support GIS.",
      order: 3
    });
    await storage.createExperience({
      company: "Center of Agroecology and Land Resources",
      role: "GIS Developer Lead",
      duration: "Mar 2017 - Jan 2019",
      location: "Yogyakarta, Indonesia",
      description: "Project for Connectivity of Protected Areas and Peat Ecosystem Cultivation in Central Kalimantan. Perform data capture and analysis for GIS product. Support in designing and creating the geospatial database. Project for Inventarisation of Peat Ecosystem Cultivation in Lamandau, Central Kalimantan. Participates in the design, development and implementation of complex applications. As needed, coordinated with existing team of sustainable commodities researchers.",
      order: 4
    });
    await storage.createExperience({
      company: "Waindo Specterra",
      role: "GIS Specialist [By Project]",
      duration: "Jul 2016 - Feb 2017",
      location: "Kalimantan, Indonesia",
      description: "Survey of chemical, biological and physical characteristics of soil for Land System in East and South Kalimantan. Perform data capture and analysis for GIS product. Support in designing and creating the geospatial database.",
      order: 5
    });
    await storage.createExperience({
      company: "Agricola Nusantara Baramineral",
      role: "GIS Specialist [By Project]",
      duration: "Jan 2016 - Jul 2016",
      location: "Riau, Indonesia",
      description: "Project for Technical Feasibility Study on Industrial Scale Vaname Shrimp Farming in Lingga Islands, Riau. Manage geospatial database and develop maps and aerial photogrammetry. Perform data capture and analysis for GIS product. Support in designing and creating the geospatial database. Oversee data flow, management, and distribution activities to support GIS.",
      order: 6
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
      { name: "ArcGIS Pro", category: "GIS Software", proficiency: 95 },
      { name: "QGIS", category: "GIS Software", proficiency: 90 },
      { name: "Google Earth Engine", category: "GIS Software", proficiency: 88 },
      { name: "MapLibre GL", category: "GIS Software", proficiency: 85 },
      { name: "Python", category: "Programming", proficiency: 90 },
      { name: "JavaScript/TypeScript", category: "Programming", proficiency: 85 },
      { name: "PostgreSQL/PostGIS", category: "Programming", proficiency: 82 },
      { name: "R", category: "Programming", proficiency: 75 },
      { name: "Satellite Imagery Analysis", category: "Remote Sensing", proficiency: 92 },
      { name: "Drone Photogrammetry", category: "Remote Sensing", proficiency: 88 },
      { name: "LiDAR Processing", category: "Remote Sensing", proficiency: 80 },
      { name: "Change Detection", category: "Remote Sensing", proficiency: 85 },
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

    // Projects - Real work with real descriptions
    await storage.createProject({
      title: "3D Flood Impact Visualization",
      description: "Interactive 3D visualization of flood-affected buildings using MapLibre GL JS with terrain rendering. Simulates varying flood water levels over urban areas with 3D building extrusions, allowing stakeholders to assess flood damage and plan mitigation strategies.",
      role: "GIS Developer & Data Scientist",
      techStack: ["MapLibre GL JS", "3D Terrain", "DEM", "JavaScript", "WebGL"],
      link: "#flood-viz",
      imageUrl: undefined,
      order: 1
    });
    await storage.createProject({
      title: "Deforestation Analysis",
      description: "Conducted comprehensive deforestation analysis using satellite imagery to monitor and assess forest cover changes over time. Applied machine learning classifiers on multi-temporal Landsat/Sentinel data.",
      role: "GIS Specialist",
      techStack: ["Remote Sensing", "Satellite Imagery", "GIS", "Python"],
      link: "https://portfolio-dimas-omega.vercel.app/port_1_deforestation_analysis/webmap.html",
      order: 2
    });
  }
}
