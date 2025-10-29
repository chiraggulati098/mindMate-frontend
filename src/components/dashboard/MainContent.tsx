import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, Loader2, FileText, Upload, Link, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { processDocument, getDocumentById, updateDocument, attachPdfToDocument, type Document } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MainContentProps {
  mode: "source" | "summary" | "flashcards" | "mcqs";
  documentType: string | null;
  selectedDocumentId?: string | null;
}

const MainContent = ({ mode, documentType, selectedDocumentId }: MainContentProps) => {
  const [isProcessed, setIsProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [notesContent, setNotesContent] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Fetch document data when a document is selected
  useEffect(() => {
    const fetchDocument = async () => {
      if (selectedDocumentId && mode === "source") {
        setLoading(true);
        // Clear all content state first
        setNotesContent("");
        setYoutubeLink("");
        setWebsiteLink("");
        setPdfFile(null);
        setImageFiles([]);
        
        try {
          const doc = await getDocumentById(selectedDocumentId);
          setDocumentData(doc);
          
          // Pre-populate form fields based on document type and content ONLY if content exists
          if (doc.type === 'text' && doc.content) {
            if (documentType === 'Notes') {
              setNotesContent(doc.content);
            } else if (documentType === 'YouTube Video' || documentType === 'YouTube video') {
              setYoutubeLink(doc.content);
            } else if (documentType === 'Website Link') {
              setWebsiteLink(doc.content);
            }
          }
          
          // Set editing mode based on whether content exists
          const hasContent = (doc.type === 'text' && doc.content && doc.content.trim()) || 
                           (doc.type === 'pdf' && doc.fileName);
          setIsEditing(!hasContent);
        } catch (error: any) {
          console.error('Error fetching document:', error);
          toast({
            title: "Error",
            description: "Failed to load document data",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Clear all state when no document is selected
        setDocumentData(null);
        setNotesContent("");
        setYoutubeLink("");
        setWebsiteLink("");
        setPdfFile(null);
        setImageFiles([]);
        setIsEditing(false);
      }
    };

    fetchDocument();
  }, [selectedDocumentId, mode, documentType]);

  const handleProcess = async () => {
    if (!selectedDocumentId) {
      toast({
        title: "No document selected",
        description: "Please select a document to process.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await processDocument(selectedDocumentId);
      setIsProcessed(true);
      toast({
        title: "Document processed successfully",
        description: "Your document has been processed and is ready for summarization, flashcards, and MCQs.",
      });
    } catch (error) {
      console.error("Error processing document:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveContent = async (content: string) => {
    if (!selectedDocumentId || !documentData) return;
    
    try {
      const updatedDoc = await updateDocument(selectedDocumentId, {
        content: content
      });
      
      // Update the document data with the new content
      setDocumentData(updatedDoc);
      setIsEditing(false);
      
      toast({
        title: "Saved",
        description: "Content saved successfully"
      });
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!selectedDocumentId) return;
    
    setIsUploading(true);
    try {
      const updatedDoc = await attachPdfToDocument(selectedDocumentId, file);
      setDocumentData(updatedDoc);
      setPdfFile(null);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "PDF uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to upload PDF",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderDocumentContent = () => {
    if (!documentData) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No content available</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setIsEditing(true)}
          >
            Add Content
          </Button>
        </div>
      );
    }

    switch (documentType) {
      case "Notes":
        if (!documentData.content || !documentData.content.trim()) {
          return (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notes content available</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                Add Notes
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{documentData.title}</h2>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                {documentData.content}
              </div>
            </div>
          </div>
        );
      
      case "YouTube Video":
      case "YouTube video":
        if (!documentData.content || !documentData.content.trim()) {
          return (
            <div className="text-center text-muted-foreground py-8">
              <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No YouTube link available</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                Add Link
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{documentData.title}</h2>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
            <div className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Link className="w-5 h-5 text-red-500" />
                <span className="font-medium">YouTube Video</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{documentData.content}</p>
              <Button onClick={() => window.open(documentData.content, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch Video
              </Button>
            </div>
          </div>
        );
      
      case "Website Link":
        if (!documentData.content || !documentData.content.trim()) {
          return (
            <div className="text-center text-muted-foreground py-8">
              <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No website link available</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                Add Link
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{documentData.title}</h2>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
            <div className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Website Link</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{documentData.content}</p>
              <Button onClick={() => window.open(documentData.content, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Website
              </Button>
            </div>
          </div>
        );
      
      case "PDFs":
      case "Handwritten Notes":
        if (!documentData.fileName) {
          return (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No PDF file attached</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                Upload PDF
              </Button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{documentData.title}</h2>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Change PDF
              </Button>
            </div>
            <div className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-8 h-8 text-red-500" />
                <div>
                  <p className="font-medium">{documentData.fileName}</p>
                  {documentData.fileSize && (
                    <p className="text-sm text-muted-foreground">
                      {(documentData.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              {documentData.fileUrl && (
                <Button onClick={() => window.open(documentData.fileUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View PDF
                </Button>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <p>Unknown document type</p>
          </div>
        );
    }
  };

  const renderSourceInput = () => {
    if (!documentType || !selectedDocumentId) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Select or add a document to get started</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading document...</span>
        </div>
      );
    }

    // Show document content if not editing and document exists
    if (!isEditing && documentData) {
      return renderDocumentContent();
    }

    switch (documentType) {
      case "Notes":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Text Notes</Label>
              {documentData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-1" />
                  {documentData.title}
                </div>
              )}
            </div>
            <Textarea
              id="notes"
              placeholder="Start typing your notes here..."
              className="min-h-[400px]"
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={() => handleSaveContent(notesContent)}>
                Save Notes
              </Button>
              <Button variant="outline" onClick={() => {
                setNotesContent(documentData?.content || "");
                setIsEditing(false);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        );
      case "PDFs":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>PDF Document</Label>
              {documentData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-1" />
                  {documentData.title}
                </div>
              )}
            </div>
            
            {documentData?.fileName ? (
              <div className="border rounded-lg p-6 bg-muted/50">
                <div className="flex items-center justify-center space-x-3 text-center">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{documentData.fileName}</p>
                    {documentData.fileSize && (
                      <p className="text-sm text-muted-foreground">
                        {(documentData.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                {documentData.fileUrl && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => window.open(documentData.fileUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View PDF
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No PDF attached</p>
                  <p className="text-muted-foreground mb-4">Upload a PDF file to get started</p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPdfFile(file);
                      }
                    }}
                    className="mb-4"
                  />
                  {pdfFile && (
                    <div className="flex items-center justify-center space-x-2">
                      <p className="text-sm">Selected: {pdfFile.name}</p>
                      <Button 
                        onClick={() => handlePdfUpload(pdfFile)}
                        disabled={isUploading}
                        size="sm"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfFile(null);
                          setIsEditing(false);
                        }}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "YouTube Video":
      case "YouTube video":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="youtube">YouTube Video Link</Label>
              {documentData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Link className="w-4 h-4 mr-1" />
                  {documentData.title}
                </div>
              )}
            </div>
            <Input
              id="youtube"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={() => handleSaveContent(youtubeLink)} disabled={!youtubeLink.trim()}>
                Save Link
              </Button>
              <Button variant="outline" onClick={() => {
                setYoutubeLink(documentData?.content || "");
                setIsEditing(false);
              }}>
                Cancel
              </Button>
              {youtubeLink && (
                <Button variant="outline" onClick={() => window.open(youtubeLink, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        );
      case "Handwritten Notes":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Handwritten Notes (PDF)</Label>
              {documentData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 mr-1" />
                  {documentData.title}
                </div>
              )}
            </div>
            
            {documentData?.fileName ? (
              <div className="border rounded-lg p-6 bg-muted/50">
                <div className="flex items-center justify-center space-x-3 text-center">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{documentData.fileName}</p>
                    {documentData.fileSize && (
                      <p className="text-sm text-muted-foreground">
                        {(documentData.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>
                {documentData.fileUrl && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => window.open(documentData.fileUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Notes
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No PDF attached</p>
                  <p className="text-muted-foreground mb-4">Upload a PDF of your handwritten notes</p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPdfFile(file);
                      }
                    }}
                    className="mb-4"
                  />
                  {pdfFile && (
                    <div className="flex items-center justify-center space-x-2">
                      <p className="text-sm">Selected: {pdfFile.name}</p>
                      <Button 
                        onClick={() => handlePdfUpload(pdfFile)}
                        disabled={isUploading}
                        size="sm"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfFile(null);
                          setIsEditing(false);
                        }}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "Website Link":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="website">Website Link</Label>
              {documentData && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Link className="w-4 h-4 mr-1" />
                  {documentData.title}
                </div>
              )}
            </div>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={websiteLink}
              onChange={(e) => setWebsiteLink(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={() => handleSaveContent(websiteLink)} disabled={!websiteLink.trim()}>
                Save Link
              </Button>
              <Button variant="outline" onClick={() => {
                setWebsiteLink(documentData?.content || "");
                setIsEditing(false);
              }}>
                Cancel
              </Button>
              {websiteLink && (
                <Button variant="outline" onClick={() => window.open(websiteLink, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (mode) {
      case "source":
        return renderSourceInput();
      case "summary":
        if (!isProcessed) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Process the Source Content first</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Summary</h2>
            <div className="p-6 rounded-lg bg-muted">
              <p className="text-lg mb-4">
                Data structures are fundamental concepts in computer science that organize and
                store data efficiently.
              </p>
              <p>
                Key types include arrays, linked lists, stacks, queues, trees, and graphs. Each
                serves specific purposes and offers different performance characteristics for
                various operations.
              </p>
            </div>
          </div>
        );
      case "flashcards":
        if (!isProcessed) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Process the Source Content first</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Flashcards</h2>
            <div className="grid gap-4">
              {[
                { q: "What is an array?", a: "A fixed-size sequential collection of elements of the same type" },
                { q: "What does LIFO stand for?", a: "Last In First Out - the principle used by stacks" },
                { q: "What is a tree structure?", a: "A hierarchical data structure with a root node and child nodes" },
              ].map((card, index) => (
                <div key={index} className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="font-semibold text-primary mb-3">Q: {card.q}</div>
                  <div className="text-muted-foreground">A: {card.a}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case "mcqs":
        if (!isProcessed) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Process the Source Content first</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Multiple Choice Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: "Which data structure follows LIFO principle?",
                  options: ["Queue", "Stack", "Array", "Tree"],
                  correct: 1,
                },
                {
                  q: "What is the time complexity of accessing an element in an array?",
                  options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
                  correct: 2,
                },
                {
                  q: "Which data structure is best suited for implementing a breadth-first search?",
                  options: ["Stack", "Array", "Queue", "Linked List"],
                  correct: 2,
                },
                {
                  q: "What is the main advantage of a linked list over an array?",
                  options: ["Faster access time", "Dynamic size", "Less memory usage", "Better cache performance"],
                  correct: 1,
                },
                {
                  q: "In a binary tree, what is the maximum number of children a node can have?",
                  options: ["1", "2", "3", "Unlimited"],
                  correct: 1,
                },
                {
                  q: "Which data structure uses FIFO principle?",
                  options: ["Stack", "Queue", "Tree", "Graph"],
                  correct: 1,
                },
                {
                  q: "What is the worst-case time complexity for searching in a binary search tree?",
                  options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                  correct: 2,
                },
                {
                  q: "Which operation is NOT typically performed on a hash table?",
                  options: ["Insert", "Delete", "Sort", "Search"],
                  correct: 2,
                },
              ].map((question, qIndex) => (
                <div key={qIndex} className="p-6 rounded-lg border bg-card">
                  <p className="font-semibold mb-4">
                    {qIndex + 1}. {question.q}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <Button
                        key={oIndex}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {String.fromCharCode(65 + oIndex)}. {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 flex flex-col relative">
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Search documents using RAG..."
            className="flex-1"
          />
          <Button size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">{renderContent()}</div>
      </ScrollArea>

      {/* Floating Process Button */}
      {mode === "source" && documentType && selectedDocumentId && !isProcessed && (
        <div className="absolute bottom-6 right-6">
          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Process Document
              </>
            )}
          </Button>
        </div>
      )}
    </main>
  );
};

export default MainContent;
