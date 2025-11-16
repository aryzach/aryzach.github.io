import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="text-xl md:text-2xl font-semibold text-foreground">
            SF Sauna Rental
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("how-it-works")} className="text-foreground hover:text-primary transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection("packages")} className="text-foreground hover:text-primary transition-colors">
              Packages
            </button>
            <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/service-areas" className="text-foreground hover:text-primary transition-colors">
              Service Areas
            </Link>
            <button onClick={() => scrollToSection("faq")} className="text-foreground hover:text-primary transition-colors">
              FAQ
            </button>
          </nav>

          {/* CTA Button */}
          <Button className="hidden md:flex bg-accent hover:bg-accent/90 text-accent-foreground">
            Get Quote
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
              <button onClick={() => scrollToSection("packages")} className="text-left text-foreground hover:text-primary transition-colors">
                Packages
              </button>
              <Link to="/pricing" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link to="/service-areas" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Service Areas
              </Link>
              <button onClick={() => scrollToSection("faq")} className="text-left text-foreground hover:text-primary transition-colors">
                FAQ
              </button>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">
                Get Quote
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
