const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "We deliver & set up",
      description: "Professional installation in your home, usually within a week. Takes about 1 hour.",
    },
    {
      number: "2",
      title: "You relax daily",
      description: "Enjoy infrared therapy in the comfort of your home. Simple controls, minimal maintenance.",
    },
    {
      number: "3",
      title: "We handle pickup",
      description: "When you're done, we come pick it up. No hassle, no strings attached.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-foreground">
          How It Works
        </h2>
        
        {/* Video Section */}
        <div className="max-w-4xl mx-auto mb-12 rounded-lg overflow-hidden shadow-lg">
          <video
            controls
            className="w-full"
          >
            <source src="/how-it-works-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
