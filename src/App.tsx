import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import HowItWorksPage from "./pages/HowItWorksPage";
import HowItStarted from "./pages/HowItStarted";
import InstallPower from "./pages/InstallPower";
import Policies from "./pages/Policies";
import LearnHub from "./pages/LearnHub";
import Contact from "./pages/Contact";
import Media from "./pages/Media";
import LearnMore from "./pages/LearnMore";
import SaunaSanFrancisco from "./pages/SaunaSanFrancisco";
import InHomeSaunaSF from "./pages/InHomeSaunaSF";
import InfraredSaunaSF from "./pages/InfraredSaunaSF";
import FinnishSaunaSF from "./pages/FinnishSaunaSF";
import SaunaRentalSF from "./pages/SaunaRentalSF";
import SaunaRentalSanFrancisco from "./pages/SaunaRentalSanFrancisco";
import SaunaRentalOakland from "./pages/SaunaRentalOakland";
import SaunaRentalBerkeley from "./pages/SaunaRentalBerkeley";
import ServiceAreas from "./pages/ServiceAreas";
import SaunaDirectory from "./pages/SaunaDirectory";
import SouthEndRowingClub from "./pages/SouthEndRowingClub";
import FitnessSFFillmore from "./pages/FitnessSFFillmore";
import EmailMoreInfo from "./pages/EmailMoreInfo";
import ThankYou from "./pages/ThankYou";
import ReservationPaymentOrScheduleCall from "./pages/ReservationPaymentOrScheduleCall";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const GAPageView = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('config', 'G-K2RGWZH97X', {
        page_path: window.location.pathname + window.location.search
      });
    }
  }, [location.pathname, location.search]);

  return null;
};

const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;

    const timeout = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ScrollToHash />
        <GAPageView />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/how-it-started" element={<HowItStarted />} />
          <Route path="/install-power" element={<InstallPower />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/learn" element={<LearnHub />} />
          <Route path="/reserve-your-sauna" element={<Contact />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/media" element={<Media />} />
          <Route path="/sauna-san-francisco" element={<SaunaSanFrancisco />} />
          <Route path="/in-home-sauna-san-francisco" element={<InHomeSaunaSF />} />
          <Route path="/infrared-sauna-san-francisco" element={<InfraredSaunaSF />} />
          <Route path="/finnish-sauna-san-francisco" element={<FinnishSaunaSF />} />
          <Route path="/sauna-rental-sf" element={<SaunaRentalSF />} />
          <Route path="/sauna-rental-san-francisco" element={<SaunaRentalSanFrancisco />} />
          <Route path="/sauna-rental-oakland" element={<SaunaRentalOakland />} />
          <Route path="/sauna-rental-berkeley" element={<SaunaRentalBerkeley />} />
          <Route path="/service-areas" element={<ServiceAreas />} />
          <Route path="/sauna-directory" element={<SaunaDirectory />} />
          <Route path="/sauna-review/south-end-rowing-club" element={<SouthEndRowingClub />} />
          <Route path="/sauna-review/fitness-sf-fillmore" element={<FitnessSFFillmore />} />
          <Route path="/email-more-info" element={<EmailMoreInfo />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/reservation-payment-or-schedule-call" element={<ReservationPaymentOrScheduleCall />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
