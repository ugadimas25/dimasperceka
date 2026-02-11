import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type InsertMessage } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

// Projects Hook
export function useProjects() {
  return useQuery({
    queryKey: [api.projects.list.path],
    queryFn: async () => {
      const res = await fetch(api.projects.list.path);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.list.responses[200].parse(await res.json());
    },
  });
}

// Skills Hook
export function useSkills() {
  return useQuery({
    queryKey: [api.skills.list.path],
    queryFn: async () => {
      const res = await fetch(api.skills.list.path);
      if (!res.ok) throw new Error("Failed to fetch skills");
      return api.skills.list.responses[200].parse(await res.json());
    },
  });
}

// Experiences Hook
export function useExperiences() {
  return useQuery({
    queryKey: [api.experiences.list.path],
    queryFn: async () => {
      const res = await fetch(api.experiences.list.path);
      if (!res.ok) throw new Error("Failed to fetch experiences");
      return api.experiences.list.responses[200].parse(await res.json());
    },
  });
}

// Educations Hook
export function useEducations() {
  return useQuery({
    queryKey: [api.educations.list.path],
    queryFn: async () => {
      const res = await fetch(api.educations.list.path);
      if (!res.ok) throw new Error("Failed to fetch educations");
      return api.educations.list.responses[200].parse(await res.json());
    },
  });
}

// Contact Hook
export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: InsertMessage) => {
      const res = await apiRequest("POST", api.contact.submit.path, data);
      return api.contact.submit.responses[200].parse(await res.json());
    },
  });
}
