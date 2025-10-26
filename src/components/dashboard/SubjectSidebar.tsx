import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Plus, FileText, ChevronLeft, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  documents: Document[];
  expanded: boolean;
}

interface SubjectSidebarProps {
  onDocumentSelect?: (docType: string) => void;
}

const SubjectSidebar = ({ onDocumentSelect }: SubjectSidebarProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: "1",
      name: "Computer Science",
      expanded: true,
      documents: [
        { id: "1-1", name: "Algorithms" },
        { id: "1-2", name: "Data Structures" },
        { id: "1-3", name: "Operating Systems" },
      ],
    },
    {
      id: "2",
      name: "Mathematics",
      expanded: false,
      documents: [
        { id: "2-1", name: "Calculus" },
        { id: "2-2", name: "Linear Algebra" },
      ],
    },
    {
      id: "3",
      name: "Physics",
      expanded: false,
      documents: [
        { id: "3-1", name: "Mechanics" },
        { id: "3-2", name: "Thermodynamics" },
        { id: "3-3", name: "Quantum Physics" },
      ],
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState("1-2");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const toggleSubject = (id: string) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, expanded: !subject.expanded } : subject
      )
    );
  };

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      const newSubject: Subject = {
        id: String(subjects.length + 1),
        name: newSubjectName,
        expanded: false,
        documents: [],
      };
      setSubjects([...subjects, newSubject]);
      setNewSubjectName("");
      setSubjectDialogOpen(false);
    }
  };

  const handleAddDocument = () => {
    if (selectedSubjectId && documentType) {
      setSubjects((prev) =>
        prev.map((subject) => {
          if (subject.id === selectedSubjectId) {
            const newDoc: Document = {
              id: `${subject.id}-${subject.documents.length + 1}`,
              name: `New ${documentType}`,
            };
            return { ...subject, documents: [...subject.documents, newDoc] };
          }
          return subject;
        })
      );
      onDocumentSelect?.(documentType);
      setDocumentType("");
      setSelectedSubjectId("");
      setDocumentDialogOpen(false);
    }
  };

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-64"} border-r bg-card flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && (
          <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 mr-2 justify-start" variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>
                  Enter the name of the subject you want to add.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject-name">Subject Name</Label>
                  <Input
                    id="subject-name"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="e.g., Biology"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddSubject}>Add Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {subjects.map((subject) => (
            <div key={subject.id} className="mb-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className={`${isCollapsed ? "w-full" : "flex-1"} justify-start font-medium`}
                  onClick={() => toggleSubject(subject.id)}
                >
                  {subject.expanded ? (
                    <ChevronDown className="w-4 h-4 mr-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  {!isCollapsed && subject.name}
                </Button>
                {!isCollapsed && (
                  <Dialog open={documentDialogOpen && selectedSubjectId === subject.id} onOpenChange={(open) => {
                    setDocumentDialogOpen(open);
                    if (!open) setSelectedSubjectId("");
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedSubjectId(subject.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Document</DialogTitle>
                        <DialogDescription>
                          Select the type of document you want to add to {subject.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="document-type">Document Type</Label>
                          <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger id="document-type">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Notes">Notes</SelectItem>
                              <SelectItem value="PDF">PDF</SelectItem>
                              <SelectItem value="YouTube Video">YouTube Video</SelectItem>
                              <SelectItem value="Handwritten Notes">Handwritten Notes</SelectItem>
                              <SelectItem value="Website Link">Website Link</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddDocument}>Add Document</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {subject.expanded && !isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  {subject.documents.map((doc) => (
                    <Button
                      key={doc.id}
                      variant={selectedDoc === doc.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => {
                        setSelectedDoc(doc.id);
                        const docType = doc.name.includes("Notes") ? "Notes" :
                                       doc.name.includes("PDF") ? "PDFs" :
                                       doc.name.includes("YouTube") ? "YouTube video" :
                                       doc.name.includes("Handwritten") ? "Handwritten Notes" :
                                       doc.name.includes("Website") ? "Website Link" : "Notes";
                        onDocumentSelect?.(docType);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {doc.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default SubjectSidebar;
