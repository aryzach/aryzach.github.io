import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Scroll to section if hash is present in URL
    if (location.hash) {
      const id = location.hash.replace('#', '');
      // Use longer timeout to ensure page is fully loaded
      const scrollToTarget = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80; // Fixed header height
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      };
      
      // Try multiple times to ensure content is loaded
      setTimeout(scrollToTarget, 100);
      setTimeout(scrollToTarget, 500);
      setTimeout(scrollToTarget, 1000);
    }
  }, [location]);

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      // Already on home page, just scroll
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80; // Fixed header height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        setIsMobileMenuOpen(false);
      }
    } else {
      // Navigate to home page with hash
      navigate(`/#${id}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-sm shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xl md:text-2xl font-semibold text-foreground hover:text-primary transition-colors"
          >
            SF Sauna Rental
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("how-it-works")} className="text-foreground hover:text-primary transition-colors">
              How It Works
            </button>
            <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <button onClick={() => scrollToSection("service-area")} className="text-foreground hover:text-primary transition-colors">
              Service Areas
            </button>
            <Link to="/media" className="text-foreground hover:text-primary transition-colors">
              Media
            </Link>
            <button onClick={() => scrollToSection("faq")} className="text-foreground hover:text-primary transition-colors">
              FAQ
            </button>
          </nav>

          {/* CTA Button */}
          <Button asChild className="hidden md:flex bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/learn-more">Learn More</Link>
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection("how-it-works")} className="text-left text-foreground hover:text-primary transition-colors">
                How It Works
              </button>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </Link>
              <button onClick={() => scrollToSection("service-area")} className="text-left text-foreground hover:text-primary transition-colors">
                Service Areas
              </button>
              <Link to="/media" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Media
              </Link>
              <button onClick={() => scrollToSection("faq")} className="text-left text-foreground hover:text-primary transition-colors">
                FAQ
              </button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
                <Link to="/learn-more" onClick={() => setIsMobileMenuOpen(false)}>Learn More</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
