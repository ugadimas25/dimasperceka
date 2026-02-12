import type {
  InsertProject, InsertSkill, InsertExperience, 
  InsertEducation, InsertMessage, Project, 
  Skill, Experience, Education, Message,
  Testimony, InsertTestimony
} from "@shared/schema";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getSkills(): Promise<Skill[]>;
  getExperiences(): Promise<Experience[]>;
  getEducations(): Promise<Education[]>;
  getTestimonies(): Promise<Testimony[]>;
  createProject(project: InsertProject): Promise<Project>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  createExperience(experience: InsertExperience): Promise<Experience>;
  createEducation(education: InsertEducation): Promise<Education>;
  createTestimony(testimony: InsertTestimony): Promise<Testimony>;
  createMessage(message: InsertMessage): Promise<Message>;
}

// In-memory storage implementation - no database needed
export class MemoryStorage implements IStorage {
  private projects: Project[] = [];
  private skills: Skill[] = [];
  private experiences: Experience[] = [];
  private educations: Education[] = [];
  private testimonies: Testimony[] = [];
  private messages: Message[] = [];
  private nextId = 1;

  async getProjects(): Promise<Project[]> {
    return [...this.projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async getSkills(): Promise<Skill[]> {
    return [...this.skills];
  }

  async getExperiences(): Promise<Experience[]> {
    return [...this.experiences].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async getEducations(): Promise<Education[]> {
    return [...this.educations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async getTestimonies(): Promise<Testimony[]> {
    return [...this.testimonies];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = { id: this.nextId++, imageUrl: null, link: null, order: 0, role: null, techStack: null, ...project };
    this.projects.push(newProject);
    return newProject;
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const newSkill: Skill = { id: this.nextId++, proficiency: null, icon: null, ...skill };
    this.skills.push(newSkill);
    return newSkill;
  }

  async createExperience(experience: InsertExperience): Promise<Experience> {
    const newExperience: Experience = { id: this.nextId++, location: null, order: 0, ...experience };
    this.experiences.push(newExperience);
    return newExperience;
  }

  async createEducation(education: InsertEducation): Promise<Education> {
    const newEducation: Education = { id: this.nextId++, description: null, order: 0, ...education };
    this.educations.push(newEducation);
    return newEducation;
  }

  async createTestimony(testimony: InsertTestimony): Promise<Testimony> {
    const newTestimony: Testimony = { id: this.nextId++, role: null, avatarUrl: null, ...testimony };
    this.testimonies.push(newTestimony);
    return newTestimony;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = { id: this.nextId++, createdAt: new Date(), ...message };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const storage = new MemoryStorage();
