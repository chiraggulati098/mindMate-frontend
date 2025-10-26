import { Brain, Zap, BookOpen, Search, Youtube, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Features = () => {
  const features = [
    {
      icon: <Brain />,
      title: "AI Summaries",
      description: "Instantly generate structured summaries from your notes or videos with advanced AI technology."
    },
    {
      icon: <Zap />,
      title: "Flashcards & Quizzes",
      description: "Learn smarter with auto-generated flashcards and multiple-choice questions tailored to your content."
    },
    {
      icon: <BookOpen />,
      title: "Smart Knowledge Base",
      description: "Organize your study material by subjects and topics with an intuitive, searchable interface."
    },
    {
      icon: <Search />,
      title: "Semantic Search (RAG)",
      description: "Ask questions in natural language and get precise answers from your own notes instantly."
    },
    {
      icon: <Youtube />,
      title: "YouTube & PDF Ingestion",
      description: "Upload PDFs, add notes, or paste YouTube links to extract knowledge instantly with AI."
    },
    {
      icon: <TrendingUp />,
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        index % 3 === 0 && "lg:border-l dark:border-neutral-800",
        index < 3 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-indigo-100 dark:from-blue-900/70 to-transparent pointer-events-none" />
      )}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-indigo-100 dark:from-blue-900/70 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
