const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Delivery & installation",
      description: "Your infrared or Finnish sauna is brought to your home and professionally installed in 2–3 hours.",
    },
    {
      number: "2",
      title: "Daily use, zero friction",
      description: "Your personal wellness ritual — warm up with infrared or go full Finnish dry heat.",
    },
    {
      number: "3",
      title: "We handle pickup",
      description: "Your lease rolls into month-to-month. When you're done, you cancel and we return for removal.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-semibold text-center md:hidden mb-12 text-foreground">
          How It Works
        </h2>
        
        {/* Mobile: Steps first, then video */}
        <div className="md:hidden mb-12">
          <div className="space-y-8 mb-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <video
              muted
              loop
              autoPlay
              playsInline
              className="w-full"
            >
              <source src="/how-it-works-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Desktop: Video left, title and steps right */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <video
              muted
              loop
              autoPlay
              playsInline
              className="w-full"
            >
              <source src="/how-it-works-video.mp4" type="video/mp4" />
            </video>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-semibold mb-8 text-foreground">
              How It Works
            </h2>
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
