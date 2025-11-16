import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">SF Sauna Rental</h3>
            <p className="text-white/70 text-sm">
              Premium infrared sauna rentals for San Francisco homes
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/service-areas" className="text-white/70 hover:text-white transition-colors">Service Areas</Link></li>
              <li><Link to="/install-power" className="text-white/70 hover:text-white transition-colors">Installation Guide</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/policies" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/policies" className="text-white/70 hover:text-white transition-colors">Cancellation Policy</Link></li>
              <li><Link to="/policies" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-white/70 text-sm mb-3">Join for sauna tips & updates</p>
            <form action="https://formspree.io/f/xwpkyllz" method="POST" className="flex gap-2">
              <Input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90">
                Join
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/70 text-sm">
            © 2024 SF Sauna Rental. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
          </div>

          <p className="text-white/70 text-sm">
            📍 San Francisco, CA | 📧 sfsaunarental@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
