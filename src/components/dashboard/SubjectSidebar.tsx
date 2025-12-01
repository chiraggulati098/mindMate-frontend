import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Plus, FileText, ChevronLeft, PanelLeftClose, PanelLeft, Trash2, FilePlus, MoreVertical } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSubjects, createSubject, deleteSubject, getDocumentsBySubject, createDocument, updateDocument, deleteDocument, type Document as ApiDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'yt_video' | 'website';
}

interface Subject {
  id: string;
  name: string;
  documents: Document[];
  expanded: boolean;
}

interface SubjectSidebarProps {
  onDocumentSelect?: (docType: string, documentId?: string) => void;
}

const SubjectSidebar = ({ onDocumentSelect }: SubjectSidebarProps) => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [standaloneDocDialogOpen, setStandaloneDocDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newDocumentType, setNewDocumentType] = useState("");
  const [newDocumentSubject, setNewDocumentSubject] = useState("");
  const [editDocumentDialogOpen, setEditDocumentDialogOpen] = useState(false);
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false);
  const [selectedDocumentForAction, setSelectedDocumentForAction] = useState<Document | null>(null);
  const [editDocumentTitle, setEditDocumentTitle] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getSubjects();
        console.log('Fetched subjects:', data);
        const subjectsWithDocs = data.map(s => ({ 
          ...s, 
          id: s._id,
          documents: [] as Document[], 
          expanded: false 
        }));
        setSubjects(subjectsWithDocs);
      } catch (error: any) {
        console.error('Fetch subjects error:', error);
        toast({ title: "Error", description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const fetchDocuments = async (subjectId: string) => {
    try {
      const documents = await getDocumentsBySubject(subjectId);
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { 
              ...subject, 
              documents: documents.map(doc => ({
                id: doc._id,
                name: doc.title,
                type: doc.type
              }))
            }
          : subject
      ));
    } catch (error: any) {
      console.error('Fetch documents error:', error);
      // Don't show toast for this error as it might be normal for new subjects
    }
  };

  const toggleSubject = (id: string) => {
    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id === id) {
          const wasExpanded = subject.expanded;
          if (!wasExpanded) {
            // Fetch documents when expanding
            fetchDocuments(id);
          }
          return { ...subject, expanded: !wasExpanded };
        }
        return subject;
      })
    );
  };

  const handleAddSubject = async () => {
    if (newSubjectName.trim()) {
      try {
        const newSubject = await createSubject(newSubjectName);
        setSubjects(prev => [...prev, { 
          ...newSubject, 
          id: newSubject._id,
          documents: [], 
          expanded: false 
        }]);
        setNewSubjectName("");
        setSubjectDialogOpen(false);
      } catch (error: any) {
        toast({ title: "Error", description: error.message });
      }
    }
  };

  const handleDeleteSubject = async (id: string) => {
    console.log('Attempting to delete subject with ID:', id);
    if (!id || id === 'undefined') {
      toast({ title: "Error", description: "Invalid subject ID" });
      return;
    }
    try {
      await deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Subject deleted successfully" });
    } catch (error: any) {
      console.error('Delete subject error:', error);
      toast({ title: "Error", description: error.message });
    }
  };

  const handleAddDocument = async () => {
    if (selectedSubjectId && documentType) {
      try {
        const docTypeMap: Record<string, 'text' | 'pdf' | 'yt_video' | 'website'> = {
          'Notes': 'text',
          'PDF': 'pdf',
          'YouTube Video': 'yt_video',
          'Website Link': 'website'
        };

        const apiDocType = docTypeMap[documentType] || 'text';
        const newDocument = await createDocument({
          title: `New ${documentType}`,
          type: apiDocType,
          content: apiDocType === 'text' ? '' : undefined,
          subjectId: selectedSubjectId
        });

        const newDoc: Document = {
          id: newDocument._id,
          name: newDocument.title,
          type: newDocument.type
        };

        setSubjects((prev) =>
          prev.map((subject) => {
            if (subject.id === selectedSubjectId) {
              return { ...subject, documents: [...subject.documents, newDoc] };
            }
            return subject;
          })
        );
        
        onDocumentSelect?.(documentType, newDocument._id);
        setDocumentType("");
        setSelectedSubjectId("");
        setDocumentDialogOpen(false);

        toast({
          title: "Document created",
          description: `New ${documentType} document created successfully.`
        });
      } catch (error: any) {
        console.error('Create document error:', error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to create document",
          variant: "destructive"
        });
      }
    }
  };

  const handleAddStandaloneDocument = async () => {
    if (newDocumentSubject && newDocumentType && newDocumentTitle.trim()) {
      try {
        const docTypeMap: Record<string, 'text' | 'pdf' | 'yt_video' | 'website'> = {
          'Notes': 'text',
          'PDF': 'pdf',
          'YouTube Video': 'yt_video',
          'Website Link': 'website'
        };

        const apiDocType = docTypeMap[newDocumentType] || 'text';
        const newDocument = await createDocument({
          title: newDocumentTitle,
          type: apiDocType,
          content: apiDocType === 'text' ? '' : undefined,
          subjectId: newDocumentSubject
        });

        const newDoc: Document = {
          id: newDocument._id,
          name: newDocument.title,
          type: newDocument.type
        };

        setSubjects((prev) =>
          prev.map((subject) => {
            if (subject.id === newDocumentSubject) {
              return { ...subject, documents: [...subject.documents, newDoc], expanded: true };
            }
            return subject;
          })
        );
        
        // Auto-select the newly created document
        setSelectedDoc(newDocument._id);
        onDocumentSelect?.(newDocumentType, newDocument._id);
        
        // Reset form
        setNewDocumentTitle("");
        setNewDocumentType("");
        setNewDocumentSubject("");
        setStandaloneDocDialogOpen(false);

        toast({
          title: "Document created",
          description: `"${newDocumentTitle}" has been created successfully.`
        });
      } catch (error: any) {
        console.error('Create document error:', error);
        toast({ 
          title: "Error", 
          description: error.message || "Failed to create document",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditDocument = async () => {
    if (selectedDocumentForAction && editDocumentTitle.trim()) {
      try {
        await updateDocument(selectedDocumentForAction.id, {
          title: editDocumentTitle
        });

        setSubjects((prev) =>
          prev.map((subject) => ({
            ...subject,
            documents: subject.documents.map((doc) =>
              doc.id === selectedDocumentForAction.id
                ? { ...doc, name: editDocumentTitle }
                : doc
            )
          }))
        );

        setEditDocumentDialogOpen(false);
        setSelectedDocumentForAction(null);
        setEditDocumentTitle("");

        toast({
          title: "Document updated",
          description: "Document name has been updated successfully."
        });
      } catch (error: any) {
        console.error('Update document error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update document",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteDocument = async () => {
    if (selectedDocumentForAction) {
      try {
        await deleteDocument(selectedDocumentForAction.id);

        setSubjects((prev) =>
          prev.map((subject) => ({
            ...subject,
            documents: subject.documents.filter((doc) => doc.id !== selectedDocumentForAction.id)
          }))
        );

        // Clear selection if the deleted document was selected
        if (selectedDoc === selectedDocumentForAction.id) {
          setSelectedDoc("");
          onDocumentSelect?.("");
        }

        setDeleteDocumentDialogOpen(false);
        setSelectedDocumentForAction(null);

        toast({
          title: "Document deleted",
          description: "Document has been deleted successfully."
        });
      } catch (error: any) {
        console.error('Delete document error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete document",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-80"} border-r bg-card flex flex-col transition-all duration-300`}>
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
          {loading ? (
            <div className="text-center py-4">Loading subjects...</div>
          ) : (
            subjects.map((subject) => (
            <div key={subject.id} className="mb-2">
              <div className="flex items-center pr-2">
                <Button
                  variant="ghost"
                  className={`${isCollapsed ? "w-full" : "flex-1 min-w-0"} justify-start font-medium`}
                  onClick={() => toggleSubject(subject.id)}
                >
                  {subject.expanded ? (
                    <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                  )}
                  {!isCollapsed && <span className="truncate">{subject.name}</span>}
                </Button>
                {!isCollapsed && (
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Dialog open={standaloneDocDialogOpen && selectedSubjectId === subject.id} onOpenChange={(open) => {
                      setStandaloneDocDialogOpen(open);
                      if (!open) {
                        setSelectedSubjectId("");
                        setNewDocumentTitle("");
                        setNewDocumentType("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedSubjectId(subject.id);
                            setNewDocumentSubject(subject.id);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Document to {subject.name}</DialogTitle>
                          <DialogDescription>
                            Create a new document for this subject.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="doc-title">Document Title</Label>
                            <Input
                              id="doc-title"
                              value={newDocumentTitle}
                              onChange={(e) => setNewDocumentTitle(e.target.value)}
                              placeholder="e.g., Chapter 1 Notes"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="doc-type">Document Type</Label>
                            <Select value={newDocumentType} onValueChange={setNewDocumentType}>
                              <SelectTrigger id="doc-type">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Text Notes">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Text Notes
                                  </div>
                                </SelectItem>
                                <SelectItem value="PDF Document">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    PDF Document
                                  </div>
                                </SelectItem>
                                <SelectItem value="YouTube Video">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    YouTube Video
                                  </div>
                                </SelectItem>

                                <SelectItem value="Website Link">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Website Link
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleAddStandaloneDocument}
                            disabled={!newDocumentTitle.trim() || !newDocumentType}
                          >
                            Create Document
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {subject.expanded && !isCollapsed && (
                <div className="ml-6 mt-1 space-y-1">
                  {subject.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center group">
                      <Button
                        variant={selectedDoc === doc.id ? "secondary" : "ghost"}
                        className="flex-1 justify-start text-sm"
                        onClick={() => {
                          setSelectedDoc(doc.id);
                          // Map document type based on the actual document type from API
                          let docType = "Notes"; // default
                          if (doc.type === 'pdf') {
                            docType = "PDFs";
                          } else if (doc.type === 'yt_video') {
                            docType = "YouTube Video";
                          } else if (doc.type === 'website') {
                            docType = "Website Link";
                          } else if (doc.type === 'text') {
                            docType = "Notes";
                          }
                          onDocumentSelect?.(docType, doc.id);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocumentForAction(doc);
                              setEditDocumentTitle(doc.name);
                              setEditDocumentDialogOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocumentForAction(doc);
                              setDeleteDocumentDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        </div>
      </ScrollArea>

      {/* Edit Document Dialog */}
      <Dialog open={editDocumentDialogOpen} onOpenChange={setEditDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Change the name of your document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-doc-title">Document Name</Label>
              <Input
                id="edit-doc-title"
                value={editDocumentTitle}
                onChange={(e) => setEditDocumentTitle(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditDocument}
              disabled={!editDocumentTitle.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <Dialog open={deleteDocumentDialogOpen} onOpenChange={setDeleteDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDocumentForAction?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocumentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteDocument}
            >
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default SubjectSidebar;
