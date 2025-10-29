import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Play, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { processDocument } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MainContentProps {
  mode: "source" | "summary" | "flashcards" | "mcqs";
  documentType: string | null;
  selectedDocumentId?: string | null;
}

const MainContent = ({ mode, documentType, selectedDocumentId }: MainContentProps) => {
  const [isProcessed, setIsProcessed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notesContent, setNotesContent] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const { toast } = useToast();

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

  const renderSourceInput = () => {
    if (!documentType) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Select or add a document to get started</p>
        </div>
      );
    }

    switch (documentType) {
      case "Notes":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Enter Your Notes</Label>
              <Textarea
                id="notes"
                placeholder="Start typing your notes here..."
                className="min-h-[400px] mt-2"
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
              />
            </div>
          </div>
        );
      case "PDFs":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf">Upload PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                className="mt-2"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              {pdfFile && <p className="text-sm text-muted-foreground mt-2">Selected: {pdfFile.name}</p>}
            </div>
          </div>
        );
      case "YouTube video":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube">YouTube Video Link</Label>
              <Input
                id="youtube"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="mt-2"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
              />
            </div>
          </div>
        );
      case "Handwritten Notes":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="handwritten">Upload Handwritten Notes</Label>
              <Input
                id="handwritten"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                className="mt-2"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              />
              {imageFiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {imageFiles.length} file(s) selected
                </p>
              )}
            </div>
          </div>
        );
      case "Website Link":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="website">Website Link</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                className="mt-2"
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
              />
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
