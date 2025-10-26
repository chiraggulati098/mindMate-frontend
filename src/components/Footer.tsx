import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold">MindMate</span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="#" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2025 MindMate. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
