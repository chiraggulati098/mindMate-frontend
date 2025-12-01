import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, Loader2, FileText, Upload, Link, ExternalLink, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { processDocument, getDocumentById, updateDocument, attachPdfToDocument, type Document, ProcessingStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState<Record<string, number>>({});
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<Record<string, boolean>>({});
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, Record<number, string>>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState<Record<string, Record<number, boolean>>>({});
  const { toast } = useToast();

  // Add polling for processing status updates
  const startStatusPolling = () => {
    const interval = setInterval(async () => {
      if (selectedDocumentId) {
        try {
          const updatedDoc = await getDocumentById(selectedDocumentId);
          setDocumentData(updatedDoc);
          
          // Stop polling if all processing is complete or failed
          const allComplete = [
            updatedDoc.summary_status,
            updatedDoc.flashcard_status,
            updatedDoc.mcq_status
          ].every(status => 
            status === ProcessingStatus.COMPLETED || 
            status === ProcessingStatus.FAILED
          );
          
          if (allComplete) {
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error polling document status:', error);
          clearInterval(interval);
        }
      }
    }, 3000); // Poll every 3 seconds
    
    // Clear interval after 10 minutes to prevent indefinite polling
    setTimeout(() => clearInterval(interval), 600000);
  };



  // Fetch document data when a document is selected
  useEffect(() => {
    const fetchDocument = async () => {
      if (selectedDocumentId) {
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
        // Keep flashcard and MCQ state as they're now document-specific
      }
    };

    fetchDocument();
  }, [selectedDocumentId]);

  // Handle form pre-population and editing state based on mode and document data
  useEffect(() => {
    if (documentData && mode === "source") {
      // Pre-populate form fields based on document type and content ONLY if content exists and in source mode
      if (documentType === 'Notes') {
        setNotesContent(documentData.content || "");
      } else if (documentType === 'YouTube Video' || documentType === 'YouTube video') {
        setYoutubeLink(documentData.content || "");
      } else if (documentType === 'Website Link') {
        setWebsiteLink(documentData.content || "");
      }
      
      // Set editing mode based on whether content exists (only for source mode)
      const hasContent = (documentData.type === 'text' && documentData.content && documentData.content.trim()) || 
                         (documentData.type === 'pdf' && documentData.fileName) ||
                         ((documentData.type === 'yt_video' || documentData.type === 'website') && documentData.content && documentData.content.trim());
      setIsEditing(!hasContent);
    } else {
      setIsEditing(false);
    }
  }, [mode, documentData, documentType]);

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
      
      // Refresh document data to get updated processing status
      const updatedDoc = await getDocumentById(selectedDocumentId);
      setDocumentData(updatedDoc);
      
      setIsProcessed(true);
      toast({
        title: "Document processing started",
        description: "Your document is being processed. Check the Summary, Flashcards, and MCQs tabs for progress.",
      });
      
      // Start polling for status updates
      startStatusPolling();
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
        if (!selectedDocumentId) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a document to view summary</p>
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
        
        const summaryStatus = documentData?.summary_status || ProcessingStatus.NOT_PROCESSED;
        
        if (summaryStatus === ProcessingStatus.NOT_PROCESSED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-2">Summary Not Generated</p>
                <p className="text-sm text-muted-foreground mb-4">Click the Process button to generate a summary</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Click Process
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (summaryStatus === ProcessingStatus.PROCESSING) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium mb-2">Processing</p>
                <p className="text-muted-foreground">Generating the best summary for you...</p>
              </div>
            </div>
          );
        }
        
        if (summaryStatus === ProcessingStatus.FAILED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-destructive opacity-50" />
              <div>
                <p className="text-lg font-medium text-destructive mb-2">Processing Failed</p>
                <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try processing again.</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process Again
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (summaryStatus === ProcessingStatus.COMPLETED) {
          return (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Summary</h2>
              <div className="p-6 rounded-lg bg-muted">
                {documentData?.summary ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-medium mb-2 text-foreground">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-foreground">{children}</li>,
                        p: ({children}) => <p className="mb-3 text-foreground leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                      }}
                    >
                      {documentData.summary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Summary content is not available. Please try processing again.
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        return null;
      case "flashcards":
        if (!selectedDocumentId) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a document to view flashcards</p>
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
        
        const flashcardStatus = documentData?.flashcard_status || ProcessingStatus.NOT_PROCESSED;
        
        if (flashcardStatus === ProcessingStatus.NOT_PROCESSED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-2">Flashcards Not Generated</p>
                <p className="text-sm text-muted-foreground mb-4">Click the Process button to generate flashcards</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Click Process
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (flashcardStatus === ProcessingStatus.PROCESSING) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium mb-2">Processing</p>
                <p className="text-muted-foreground">Generating the best flashcards for you...</p>
              </div>
            </div>
          );
        }
        
        if (flashcardStatus === ProcessingStatus.FAILED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-destructive opacity-50" />
              <div>
                <p className="text-lg font-medium text-destructive mb-2">Processing Failed</p>
                <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try processing again.</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process Again
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (flashcardStatus === ProcessingStatus.COMPLETED) {
          const flashcards = documentData?.flashcards || [];
          
          if (!flashcards || flashcards.length === 0) {
            return (
              <div className="text-center text-muted-foreground py-8">
                <p>Flashcard content is not available. Please try processing again.</p>
              </div>
            );
          }
          
          const docFlashcardIndex = selectedDocumentId ? (currentFlashcardIndex[selectedDocumentId] ?? 0) : 0;
          const docIsFlipped = selectedDocumentId ? (isFlashcardFlipped[selectedDocumentId] ?? false) : false;
          const currentCard = flashcards[docFlashcardIndex];
          
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Flashcards</h2>
                <div className="text-sm text-muted-foreground">
                  {docFlashcardIndex + 1} of {flashcards.length}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Card 
                  className="w-full max-w-2xl h-80 cursor-pointer transition-all duration-300 hover:shadow-lg"
                  onClick={() => {
                    if (selectedDocumentId) {
                      setIsFlashcardFlipped(prev => ({
                        ...prev,
                        [selectedDocumentId]: !docIsFlipped
                      }));
                    }
                  }}
                >
                  <CardContent className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="text-lg font-medium text-muted-foreground">
                        {docIsFlipped ? "Answer" : "Question"}
                      </div>
                      <div className="text-xl leading-relaxed">
                        {docIsFlipped ? currentCard.back : currentCard.front}
                      </div>
                      <div className="text-sm text-muted-foreground pt-4">
                        Click to {docIsFlipped ? "see question" : "reveal answer"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedDocumentId) {
                      const newIndex = Math.max(0, docFlashcardIndex - 1);
                      setCurrentFlashcardIndex(prev => ({
                        ...prev,
                        [selectedDocumentId]: newIndex
                      }));
                      setIsFlashcardFlipped(prev => ({
                        ...prev,
                        [selectedDocumentId]: false
                      }));
                    }
                  }}
                  disabled={docFlashcardIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedDocumentId) {
                      setIsFlashcardFlipped(prev => ({
                        ...prev,
                        [selectedDocumentId]: false
                      }));
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Card
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedDocumentId) {
                      const newIndex = Math.min(flashcards.length - 1, docFlashcardIndex + 1);
                      setCurrentFlashcardIndex(prev => ({
                        ...prev,
                        [selectedDocumentId]: newIndex
                      }));
                      setIsFlashcardFlipped(prev => ({
                        ...prev,
                        [selectedDocumentId]: false
                      }));
                    }
                  }}
                  disabled={docFlashcardIndex === flashcards.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          );
        }
        
        return null;
      case "mcqs":
        if (!selectedDocumentId) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a document to view MCQs</p>
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
        
        const mcqStatus = documentData?.mcq_status || ProcessingStatus.NOT_PROCESSED;
        
        if (mcqStatus === ProcessingStatus.NOT_PROCESSED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50" />
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-2">MCQs Not Generated</p>
                <p className="text-sm text-muted-foreground mb-4">Click the Process button to generate multiple choice questions</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Click Process
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (mcqStatus === ProcessingStatus.PROCESSING) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <div>
                <p className="text-lg font-medium mb-2">Processing</p>
                <p className="text-muted-foreground">Generating the best MCQs for you...</p>
              </div>
            </div>
          );
        }
        
        if (mcqStatus === ProcessingStatus.FAILED) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <FileText className="w-16 h-16 text-destructive opacity-50" />
              <div>
                <p className="text-lg font-medium text-destructive mb-2">Processing Failed</p>
                <p className="text-sm text-muted-foreground mb-4">Something went wrong. Please try processing again.</p>
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process Again
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        }
        
        if (mcqStatus === ProcessingStatus.COMPLETED) {
          const mcqs = documentData?.mcqs || [];
          
          if (!mcqs || mcqs.length === 0) {
            return (
              <div className="text-center text-muted-foreground py-8">
                <p>MCQ content is not available. Please try processing again.</p>
              </div>
            );
          }
          
          const handleMcqAnswer = (questionIndex: number, answer: string) => {
            if (!selectedDocumentId) return;
            setMcqAnswers(prev => ({ 
              ...prev, 
              [selectedDocumentId]: { 
                ...prev[selectedDocumentId], 
                [questionIndex]: answer 
              }
            }));
          };
          
          const handleMcqSubmit = (questionIndex: number) => {
            if (!selectedDocumentId) return;
            setMcqSubmitted(prev => ({ 
              ...prev, 
              [selectedDocumentId]: { 
                ...prev[selectedDocumentId], 
                [questionIndex]: true 
              }
            }));
          };
          
          const getOptionStyle = (questionIndex: number, optionKey: string, mcq: any) => {
            const documentMcqSubmitted = selectedDocumentId ? mcqSubmitted[selectedDocumentId] || {} : {};
            const documentMcqAnswers = selectedDocumentId ? mcqAnswers[selectedDocumentId] || {} : {};
            const isSubmitted = documentMcqSubmitted[questionIndex];
            const selectedAnswer = documentMcqAnswers[questionIndex];
            const correctAnswer = mcq.correct_answer;
            
            if (!isSubmitted) {
              return selectedAnswer === optionKey 
                ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100" 
                : "hover:bg-muted/50 hover:border-muted-foreground/20";
            }
            
            if (optionKey === correctAnswer) {
              return "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100";
            }
            
            if (optionKey === selectedAnswer && optionKey !== correctAnswer) {
              return "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-900 dark:text-red-100";
            }
            
            return "opacity-60";
          };
          
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Multiple Choice Questions</h2>
              
              <div className="space-y-6">
                {mcqs.map((mcq: any, questionIndex: number) => {
                  const documentMcqSubmitted = selectedDocumentId ? mcqSubmitted[selectedDocumentId] || {} : {};
                  const documentMcqAnswers = selectedDocumentId ? mcqAnswers[selectedDocumentId] || {} : {};
                  const isSubmitted = documentMcqSubmitted[questionIndex];
                  const selectedAnswer = documentMcqAnswers[questionIndex];
                  const correctAnswer = mcq.correct_answer;
                  
                  return (
                    <Card key={questionIndex} className="w-full">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Question {questionIndex + 1}
                        </CardTitle>
                        <CardDescription className="text-base font-medium text-foreground">
                          {mcq.question}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(mcq.options).map(([optionKey, optionValue]: [string, any]) => (
                          <div
                            key={optionKey}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              getOptionStyle(questionIndex, optionKey, mcq)
                            }`}
                            onClick={() => !isSubmitted && handleMcqAnswer(questionIndex, optionKey)}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-sm">{optionKey}.</span>
                              <span>{optionValue}</span>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex items-center justify-between pt-4">
                          {!isSubmitted ? (
                            <Button
                              onClick={() => handleMcqSubmit(questionIndex)}
                              disabled={!selectedAnswer}
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <div className="flex items-center space-x-4">
                              {selectedAnswer === correctAnswer ? (
                                <div className="text-green-600 font-medium">
                                  ✓ Correct! Well done.
                                </div>
                              ) : (
                                <div className="text-red-600 font-medium">
                                  ✗ Incorrect. The correct answer is {correctAnswer}.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        }
        
        return null;
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
      {mode === "source" && documentType && selectedDocumentId && (
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
            ) : isProcessed ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Process Again
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
