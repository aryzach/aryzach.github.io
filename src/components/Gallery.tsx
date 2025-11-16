import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const galleryItems = [
  { type: "image", src: gallery1 },
  { type: "video", src: "/media/0804.mp4" },
  { type: "image", src: gallery2 },
  { type: "image", src: gallery3 },
  { type: "video", src: "/media/gallery-video.mp4" },
  { type: "image", src: gallery4 },
];

const Gallery = () => {
  return (
    <section className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-foreground">
          Real SF Homes
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          See how our saunas fit beautifully into apartments and homes across San Francisco
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className="aspect-[4/3] rounded-lg overflow-hidden shadow-lg"
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={`SF Sauna installation ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
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
      </div>
    </section>
  );
};

export default Gallery;
