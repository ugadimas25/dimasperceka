import { FloodMap3D } from "@/components/FloodMap3D";

export default function ProjectFloodAnalysis() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <FloodMap3D fullPage />
    </div>
  );
}
