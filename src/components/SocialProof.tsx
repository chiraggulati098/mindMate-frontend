import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const SocialProof = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Medical Student",
      content: "MindMate has completely transformed how I study. The AI summaries save me hours every week!",
      rating: 5,
      initials: "SC"
    },
    {
      name: "Marcus Johnson",
      role: "Computer Science Major",
      content: "The semantic search feature is incredible. I can find exactly what I need from my notes instantly.",
      rating: 5,
      initials: "MJ"
    },
    {
      name: "Emma Rodriguez",
      role: "Law Student",
      content: "Best study tool I've ever used. The flashcards and quizzes help me retain information so much better.",
      rating: 5,
      initials: "ER"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16 animate-fade-up">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Loved by students all over the world 🌍
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students who are learning smarter
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className="animate-fade-up hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
