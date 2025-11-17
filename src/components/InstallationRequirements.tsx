import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const InstallationRequirements = () => {
  const requirements = [
    "Standard 120V outlet nearby",
    "Ceiling height 7 ft or higher",
    "Floor space: ~4×4 ft",
    "No ventilation needed",
    "Fully apartment-friendly",
    "No permits or electrician required",
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Will it fit?</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-medium mb-4 text-center text-card-foreground">
              Indoor Sauna Requirements:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="text-primary flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-muted-foreground">{req}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/install-power">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Full Installation Guide
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default InstallationRequirements;
