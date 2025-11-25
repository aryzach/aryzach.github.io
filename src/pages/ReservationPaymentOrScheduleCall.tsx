import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar } from "lucide-react";

const ReservationPaymentOrScheduleCall = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground">
              Complete Your Reservation
            </h1>
            
            <div className="space-y-8">
              <div className="bg-[hsl(var(--color-bg))] p-8 rounded-lg border border-[hsl(var(--color-ui))]">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Pay Reservation Fee
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Complete your reservation by paying the reservation fee. If you choose to lease the sauna for at least 6 months, this fee will go towards your rental payments.
                </p>
                <Button 
                  asChild 
                  size="lg"
                  className="w-full"
                >
                  <a 
                    href="https://buy.stripe.com/eVqdR999Z8xo98w0Lh6Vq0i" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Pay Reservation Fee
                    <ExternalLink className="ml-2" size={18} />
                  </a>
                </Button>
              </div>

              <div className="text-center py-4">
                <span className="text-lg text-muted-foreground">or</span>
              </div>

              <div className="bg-[hsl(var(--color-bg))] p-8 rounded-lg border border-[hsl(var(--color-ui))]">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  Schedule a Call
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  If you have more questions and would like to chat before reserving your sauna, feel free to schedule a video call.
                </p>
                <Button 
                  asChild 
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <a 
                    href="https://calendar.app.google/tn9D96XCvg1sYfZGA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Calendar className="mr-2" size={18} />
                    Schedule Video Call
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ReservationPaymentOrScheduleCall;
