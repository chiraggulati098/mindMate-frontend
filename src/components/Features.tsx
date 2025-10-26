import { Brain, Zap, BookOpen, Search, Youtube, TrendingUp } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Summaries",
      description: "Instantly generate structured summaries from your notes or videos with advanced AI technology."
    },
    {
      icon: Zap,
      title: "Flashcards & Quizzes",
      description: "Learn smarter with auto-generated flashcards and multiple-choice questions tailored to your content."
    },
    {
      icon: BookOpen,
      title: "Smart Knowledge Base",
      description: "Organize your study material by subjects and topics with an intuitive, searchable interface."
    },
    {
      icon: Search,
      title: "Semantic Search (RAG)",
      description: "Ask questions in natural language and get precise answers from your own notes instantly."
    },
    {
      icon: Youtube,
      title: "YouTube & PDF Ingestion",
      description: "Upload PDFs, add notes, or paste YouTube links to extract knowledge instantly with AI."
    },
    {
      icon: TrendingUp,
      title: "Progress & Retention Tools",
      description: "Track what you've learned and revisit intelligently with spaced repetition algorithms."
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold">
            What You Unlock with MindMate ✨
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform your learning experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <FeatureCard {...feature} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
