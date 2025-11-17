const HealthBenefits = () => {
  const benefits = [
    "Better sleep + stress reduction",
    "Consistent daily recovery",
    "Enjoy a warm ritual in cold SF homes",
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h3 className="text-xl md:text-2xl font-medium mb-6 text-foreground">
          Why people rent a home sauna
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="text-muted-foreground">
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HealthBenefits;
