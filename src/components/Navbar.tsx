import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎵</span>
            <span className="text-xl font-bold font-display text-foreground">NoizLabs</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/create" 
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Create
            </Link>
            <Link 
              to="/tokens" 
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Explore
            </Link>
            <Link 
              to="/trade" 
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Trade
            </Link>
          </div>

          {/* Connect Wallet */}
          <Button variant="hero" size="sm">
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
