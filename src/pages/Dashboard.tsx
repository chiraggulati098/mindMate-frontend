import { useState } from "react";
import TopNav from "@/components/dashboard/TopNav";
import SubjectSidebar from "@/components/dashboard/SubjectSidebar";
import MainContent from "@/components/dashboard/MainContent";
import ModeSidebar from "@/components/dashboard/ModeSidebar";

const Dashboard = () => {
  const [activeMode, setActiveMode] = useState<"source" | "summary" | "flashcards" | "mcqs">("source");
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        <SubjectSidebar onDocumentSelect={setSelectedDocType} />
        <MainContent mode={activeMode} documentType={selectedDocType} />
        <ModeSidebar activeMode={activeMode} onModeChange={setActiveMode} />
      </div>
    </div>
  );
};

export default Dashboard;
