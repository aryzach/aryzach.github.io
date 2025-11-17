import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SaunaComparison = () => {
  const infraredFeatures = [
    "Comfortable temps",
    "Easiest daily ritual",
    "Heats fastest",
    "Simple install",
  ];

  const finnishFeatures = [
    "Hotter, traditional experience",
    "Strong heat",
    "Best for sweat lovers",
  ];

  return (
    <section className="mb-12 md:mb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-foreground">
          Infrared vs Finnish
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Infrared Sauna</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {infraredFeatures.map((feature, idx) => (
                  <li key={idx} className="text-muted-foreground flex items-center gap-2">
                    <span className="text-primary">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Finnish Dry Sauna</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {finnishFeatures.map((feature, idx) => (
                  <li key={idx} className="text-muted-foreground flex items-center gap-2">
                    <span className="text-primary">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SaunaComparison;
