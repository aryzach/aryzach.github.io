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

const Contact = () => {
  useSEO(seoData.reserveYourSauna);
  const [saunaType, setSaunaType] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>();

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

            <form 
              action="https://api.web3forms.com/submit" 
              method="POST" 
              className="space-y-6"
            >
              <input type="hidden" name="access_key" value="c69ea9bb-1c41-4a04-9948-6cf7aa7f09ef" />
              <input type="hidden" name="redirect" value="https://sfsaunarental.com/reservation-payment-or-schedule-call" />
              <input type="hidden" name="sauna_type" value={saunaType} />
              <input type="hidden" name="location" value={location} />
              <input type="hidden" name="preferred_date" value={date ? format(date, "PPP") : ""} />
              
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
                />
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
                disabled={!saunaType || !location || !date}
              >
                Reserve Now
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