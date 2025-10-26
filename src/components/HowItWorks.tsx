import { Upload, Sparkles, BookText, MessageSquare } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      title: "Add your study materials",
      description: "PDFs, notes, YouTube links"
    },
    {
      icon: Sparkles,
      title: "AI organizes and summarizes",
      description: "Intelligent content processing"
    },
    {
      icon: BookText,
      title: "Generate learning tools",
      description: "Flashcards, quizzes, and insights"
    },
    {
      icon: MessageSquare,
      title: "Search or ask questions",
      description: "Anytime, anywhere access"
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Your Learning, Streamlined
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to supercharge your study sessions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group animate-fade-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-[calc((100%-6rem)/4 + 2rem)] h-0.5 bg-gradient-to-r from-primary to-transparent -z-10" />
              )}
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <div className="text-sm font-bold text-primary">Step {index + 1}</div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
