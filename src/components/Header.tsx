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

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    navigate(`/#${id}`);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[hsl(var(--color-bg))]/95 backdrop-blur-sm border-b border-[hsl(var(--color-ui))]"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-heading text-xl md:text-2xl font-semibold text-[hsl(var(--color-heading))] hover:text-[hsl(var(--color-accent))] transition-colors"
          >
            SF Sauna
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-sans">
            <button onClick={() => scrollToSection("how-it-works")} className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
              How It Works
            </button>
            <Link to="/pricing" className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
              Pricing
            </Link>
            <button onClick={() => scrollToSection("service-area")} className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
              Service Areas
            </button>
            <Link to="/media" className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
              Media
            </Link>
            <button onClick={() => scrollToSection("faq")} className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
              FAQ
            </button>
          </nav>

          {/* CTA Button */}
          <Button asChild className="hidden md:flex font-sans font-medium">
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
          <nav className="md:hidden py-4 border-t border-[hsl(var(--color-ui))] font-sans">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollToSection("how-it-works")} className="text-left text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
                How It Works
              </button>
              <Link to="/pricing" className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </Link>
              <button onClick={() => scrollToSection("service-area")} className="text-left text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
                Service Areas
              </button>
              <Link to="/media" className="text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Media
              </Link>
              <button onClick={() => scrollToSection("faq")} className="text-left text-[hsl(var(--color-text))] hover:text-[hsl(var(--color-accent))] transition-colors">
                FAQ
              </button>
              <Button asChild className="w-full font-sans font-medium">
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
