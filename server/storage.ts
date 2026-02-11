import { db } from "./db";
import {
  projects, skills, experiences, educations, messages,
  type InsertProject, type InsertSkill, type InsertExperience, 
  type InsertEducation, type InsertMessage, type Project, 
  type Skill, type Experience, type Education, type Message
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Read methods
  getProjects(): Promise<Project[]>;
  getSkills(): Promise<Skill[]>;
  getExperiences(): Promise<Experience[]>;
  getEducations(): Promise<Education[]>;
  
  // Write methods (for seeding/admin in future)
  createProject(project: InsertProject): Promise<Project>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  createEducation(education: InsertEducation): Promise<Education>;
  
  // Contact
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(asc(projects.order));
  }

  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills);
  }

  async getExperiences(): Promise<Experience[]> {
    return await db.select().from(experiences).orderBy(desc(experiences.id)); // Assuming ID order roughly correlates to recency or use order field
  }

  async getEducations(): Promise<Education[]> {
    return await db.select().from(educations).orderBy(desc(educations.year));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const [skill] = await db.insert(skills).values(insertSkill).returning();
    return skill;
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    const [experience] = await db.insert(experiences).values(insertExperience).returning();
    return experience;
  }

  async createEducation(insertEducation: InsertEducation): Promise<Education> {
    const [education] = await db.insert(educations).values(insertEducation).returning();
    return education;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
