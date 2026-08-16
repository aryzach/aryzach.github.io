import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/assetUrl";
import testimonial1 from "@/assets/testimonial-1.mp4.asset.json";
import testimonial2 from "@/assets/testimonial-2.mp4.asset.json";
import testimonial3 from "@/assets/testimonial-3.mp4.asset.json";

const videos = [
  { src: assetUrl(testimonial1), label: "SF Sauna customer sharing their traditional sauna rental experience in San Francisco" },
  { src: assetUrl(testimonial2), label: "San Francisco customer reviewing their in-home traditional sauna rental" },
  { src: assetUrl(testimonial3), label: "Bay Area customer talking about their backyard sauna rental" },
];

const VideoTestimonials = ({ className }: { className?: string }) => (
  <section className={cn("py-16 md:py-24 bg-background", className)}>
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-5xl font-semibold text-center mb-10 text-foreground">
        What Customers Are Saying
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {videos.map((v) => (
          <video
            key={v.src}
            controls
            playsInline
            preload="metadata"
            aria-label={v.label}
            className="w-full aspect-[9/16] rounded-lg bg-charcoal object-cover"
          >
            <source src={v.src} type="video/mp4" />
          </video>
        ))}
      </div>
    </div>
  </section>
);

export default VideoTestimonials;
