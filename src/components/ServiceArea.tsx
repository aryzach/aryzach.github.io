import ContactLeadForm from "@/components/lead/ContactLeadForm";

const ServiceArea = () => {
  return (
    <section id="service-area" className="py-10 md:py-14 bg-cedar-section">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
          Ready for daily heat therapy at home?
        </h2>
        <ContactLeadForm
          formSource="homepage_service_area"
          formName="Homepage Service Area Contact"
        />
      </div>
    </section>
  );
};

export default ServiceArea;
