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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-charcoal/95 backdrop-blur-sm border-b border-white/10"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <button 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-heading text-xl md:text-2xl font-semibold text-white hover:text-accent transition-colors"
          >
            SF Sauna
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-sans">
            <Link to="/how-it-works" className="text-white/70 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link to="/how-it-started" className="text-white/70 hover:text-white transition-colors">
              How It Started
            </Link>
            <Link to="/pricing" className="text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/service-areas" className="text-white/70 hover:text-white transition-colors">
              Service Areas
            </Link>
            <Link to="/media" className="text-white/70 hover:text-white transition-colors">
              Media
            </Link>
            <button onClick={() => scrollToSection("faq")} className="text-white/70 hover:text-white transition-colors">
              FAQ
            </button>
          </nav>

          {/* CTA Button */}
          <Button asChild className="hidden md:flex font-sans font-medium bg-accent hover:bg-accent/90 text-white">
            <Link to="/reserve-your-sauna">Reserve Your Sauna</Link>
          </Button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/10 font-sans">
            <div className="flex flex-col gap-4">
              <Link to="/how-it-works" className="text-left text-white/70 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                How It Works
              </Link>
              <Link to="/how-it-started" className="text-left text-white/70 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                How It Started
              </Link>
              <Link to="/pricing" className="text-white/70 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link to="/service-areas" className="text-white/70 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Service Areas
              </Link>
              <Link to="/media" className="text-white/70 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Media
              </Link>
              <button onClick={() => scrollToSection("faq")} className="text-left text-white/70 hover:text-white transition-colors">
                FAQ
              </button>
              <Button asChild className="w-full font-sans font-medium bg-accent hover:bg-accent/90 text-white">
                <Link to="/reserve-your-sauna" onClick={() => setIsMobileMenuOpen(false)}>Reserve Your Sauna</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
