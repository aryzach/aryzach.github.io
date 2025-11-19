import gallery3 from "@/assets/gallery-3.jpg";
import saunaTemp from "@/assets/sauna-temp.png";
import lindseySauna from "@/assets/lindsey-sauna.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const galleryItems = [
  { type: "image", src: gallery3 },
  { type: "image", src: saunaTemp },
  { type: "image", src: lindseySauna },
];

const Gallery = () => {
  return (
    <section className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-semibold text-center mb-4 text-foreground">
          Indoor & Outdoor Saunas
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Infrared or Finnish dry sauna options available. See real installations across the Bay Area.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className="overflow-hidden aspect-[9/16]"
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={`SF Sauna installation ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  preload="metadata"
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) {
                      video.play();
                    } else {
                      video.pause();
                    }
                  }}
                >
                  <source src={item.src} type="video/mp4" />
                </video>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link to="/media">
            <Button size="lg" className="bg-accent hover:bg-accent-dark text-white">
              View More Installations
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
