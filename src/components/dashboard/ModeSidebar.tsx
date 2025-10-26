import { Button } from "@/components/ui/button";
import { FileText, FileDown, Layers, HelpCircle } from "lucide-react";

interface ModeSidebarProps {
  activeMode: "source" | "summary" | "flashcards" | "mcqs";
  onModeChange: (mode: "source" | "summary" | "flashcards" | "mcqs") => void;
}

const ModeSidebar = ({ activeMode, onModeChange }: ModeSidebarProps) => {
  const modes = [
    { id: "source" as const, label: "Source", icon: FileText },
    { id: "summary" as const, label: "Summary", icon: FileDown },
    { id: "flashcards" as const, label: "Flashcards", icon: Layers },
    { id: "mcqs" as const, label: "MCQs", icon: HelpCircle },
  ];

  return (
    <aside className="w-20 border-l bg-card flex flex-col items-center py-4 gap-2">
      {modes.map((mode) => (
        <Button
          key={mode.id}
          variant={activeMode === mode.id ? "default" : "ghost"}
          size="icon"
          className="w-14 h-14 flex flex-col gap-1 p-2"
          onClick={() => onModeChange(mode.id)}
          title={mode.label}
        >
          <mode.icon className="w-5 h-5" />
          <span className="text-xs">{mode.label}</span>
        </Button>
      ))}
    </aside>
  );
};

export default ModeSidebar;
