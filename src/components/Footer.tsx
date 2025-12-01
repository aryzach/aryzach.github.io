import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => {
  const location = useLocation();

  const handlePoliciesClick = (e: React.MouseEvent) => {
    if (location.pathname === "/policies") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-charcoal text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-accent">SF Sauna</h3>
            <p className="text-white/70 text-sm">
              Premium in-home sauna rentals in the San Francisco Bay Area
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium mb-4 text-accent">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="tel:+14154890261" 
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
                  itemProp="telephone"
                >
                  <Phone size={14} />
                  (415) 489-0261
                </a>
              </li>
              <li>
                <a 
                  href="https://share.google/veQFqIFODS6dBdPmM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors flex items-start gap-2"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <span itemProp="streetAddress">1618 McAllister St</span><br />
                    <span itemProp="addressLocality">San Francisco</span>, <span itemProp="addressRegion">CA</span> <span itemProp="postalCode">94115</span>
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:sfsaunarental@gmail.com" 
                  className="text-white/70 hover:text-white transition-colors flex items-center gap-2"
                  itemProp="email"
                >
                  <Mail size={14} />
                  sfsaunarental@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium mb-4 text-accent">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/service-areas" className="text-white/70 hover:text-white transition-colors">Service Areas</Link></li>
              <li><Link to="/install-power" className="text-white/70 hover:text-white transition-colors">Installation Guide</Link></li>
              <li><Link to="/learn-more" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Blog */}
          <div>
            <h4 className="font-medium mb-4 text-accent">Blog</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sauna-directory" className="text-white/70 hover:text-white transition-colors">Sauna Directory</Link></li>
              <li><Link to="/sauna-san-francisco" className="text-white/70 hover:text-white transition-colors">Sauna San Francisco</Link></li>
              <li><Link to="/in-home-sauna-san-francisco" className="text-white/70 hover:text-white transition-colors">In-Home Sauna SF</Link></li>
              <li><Link to="/infrared-sauna-san-francisco" className="text-white/70 hover:text-white transition-colors">Infrared Sauna SF</Link></li>
              <li><Link to="/finnish-sauna-san-francisco" className="text-white/70 hover:text-white transition-colors">Finnish Sauna SF</Link></li>
              <li><Link to="/sauna-rental-sf" className="text-white/70 hover:text-white transition-colors">Sauna Rental SF</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium mb-4 text-accent">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/policies" onClick={handlePoliciesClick} className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-medium mb-4 text-accent">Stay Updated</h4>
            <p className="text-white/70 text-sm mb-3">Join for sauna tips & updates</p>
            <div className="flex gap-2">
              <Input
                type="email"
                name="email"
                placeholder="Your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Link to="/learn-more">
                <Button type="button" size="sm" className="bg-accent hover:bg-accent/90">
                  Join
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/70 text-sm">
            © 2024 SF Sauna Rental. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a href="https://www.instagram.com/sfsaunarental/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="http://x.com/saunaManOfSF" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          <a 
            href="https://share.google/veQFqIFODS6dBdPmM"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors text-sm"
          >
            View on Google Maps →
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
