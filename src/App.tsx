import { SceneryCanvas } from "@/components/scenery/SceneryCanvas";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <main className="relative w-full h-[100dvh] overflow-hidden select-none touch-none overscroll-none bg-background">
      <SceneryCanvas />
      <Toaster position="top-right" />
    </main>
  );
}
