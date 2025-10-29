import { useState } from "react";
import TopNav from "@/components/dashboard/TopNav";
import SubjectSidebar from "@/components/dashboard/SubjectSidebar";
import MainContent from "@/components/dashboard/MainContent";
import ModeSidebar from "@/components/dashboard/ModeSidebar";

const Dashboard = () => {
  const [activeMode, setActiveMode] = useState<"source" | "summary" | "flashcards" | "mcqs">("source");
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  const handleDocumentSelect = (docType: string, documentId?: string) => {
    setSelectedDocType(docType);
    setSelectedDocumentId(documentId || null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        <SubjectSidebar onDocumentSelect={handleDocumentSelect} />
        <MainContent 
          mode={activeMode} 
          documentType={selectedDocType} 
          selectedDocumentId={selectedDocumentId}
        />
        <ModeSidebar activeMode={activeMode} onModeChange={setActiveMode} />
      </div>
    </div>
  );
};

export default Dashboard;
