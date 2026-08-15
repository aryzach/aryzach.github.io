import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { submitLeadToGHL, splitFullName } from "@/lib/submitLeadToGHL";

const Contact = () => {
  useSEO(seoData.reserveYourSauna);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saunaType, setSaunaType] = useState("");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("");
  const [date, setDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const invalid = validateContact({ email, phone });
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSubmitting(true);
    const { first_name, last_name } = splitFullName(name);
    const res = await submitLeadToGHL({
      form_source: "reserve_your_sauna",
      form_name: "Reserve Your Sauna",
      fields: {
        name, first_name, last_name, email, phone, city, region,
        sauna_type: saunaType,
        installation_location: location,
        preferred_installation_date: date ? format(date, "yyyy-MM-dd") : undefined,
      },
    });
    setSubmitting(false);
    if (res.ok) navigate("/reservation-payment-or-schedule-call");
    else toast.error("Something went wrong. Please try again.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground">
              Check Availability
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Fill out the form below and we'll get back to you to confirm your installation date.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  placeholder="(555) 555-5555"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  required
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select value={region} onValueChange={setRegion} required>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select your area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sf-bay-area">San Francisco Bay Area</SelectItem>
                    <SelectItem value="los-angeles">Los Angeles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sauna-type">
                  Sauna Type <span className="text-destructive">*</span>
                </Label>
                <Select value={saunaType} onValueChange={setSaunaType} required>
                  <SelectTrigger id="sauna-type">
                    <SelectValue placeholder="Select sauna type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infrared">Infrared Sauna</SelectItem>
                    <SelectItem value="finnish">Steam Sauna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Indoor / Outdoor <span className="text-destructive">*</span>
                </Label>
                <Select value={location} onValueChange={setLocation} required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select Indoor / Outdoor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Preferred Installation Date <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Steam saunas will be available in 3 months, and infrared saunas are available periodically. Pre-order a steam sauna today, or get on the waitlist for the next available infrared sauna.
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
              </Popover>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || !saunaType || !location || !region || !date}
              >
                {submitting ? "Sending…" : "Reserve Now"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;