import { z } from "zod";

// === TYPE DEFINITIONS (No database required) ===

export interface Project {
  id: number;
  title: string;
  description: string;
  role: string | null;
  techStack: string[] | null;
  imageUrl: string | null;
  link: string | null;
  order: number | null;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency: number | null;
  icon: string | null;
}

export interface Experience {
  id: number;
  company: string;
  role: string;
  duration: string;
  description: string;
  location: string | null;
  order: number | null;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  year: string;
  description: string | null;
  order: number | null;
}

export interface Testimony {
  id: number;
  name: string;
  role: string | null;
  content: string;
  avatarUrl: string | null;
}

export interface Message {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: Date | null;
}

// === INSERT SCHEMAS ===

export const insertProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  role: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  link: z.string().optional(),
  order: z.number().optional(),
});

export const insertSkillSchema = z.object({
  name: z.string(),
  category: z.string(),
  proficiency: z.number().optional(),
  icon: z.string().optional(),
});

export const insertExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  duration: z.string(),
  description: z.string(),
  location: z.string().optional(),
  order: z.number().optional(),
});

export const insertEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  year: z.string(),
  description: z.string().optional(),
  order: z.number().optional(),
});

export const insertTestimonySchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  content: z.string(),
  avatarUrl: z.string().optional(),
});

export const insertMessageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  message: z.string().min(1, "Message is required"),
});

// === INSERT TYPES ===

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type InsertTestimony = z.infer<typeof insertTestimonySchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
