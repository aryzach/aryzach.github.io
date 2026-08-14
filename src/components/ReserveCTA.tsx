import ContactLeadForm from "@/components/lead/ContactLeadForm";

const ReserveCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-primary-foreground">
          Ready to start your sauna ritual?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join the many San Franciscans enjoying daily heat therapy at home
        </p>
        <ContactLeadForm
          formSource="homepage_footer_cta"
          formName="Homepage Bottom CTA Contact"
        />
      </div>
    </section>
  );
};

export default ReserveCTA;
