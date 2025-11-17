import Header from "@/components/Header";
import Footer from "@/components/Footer";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery4 from "@/assets/gallery-4.jpg";

const Media = () => {
  const mediaItems = [
    { type: "image", src: gallery1 },
    { type: "video", src: "/media/0804_3.mp4" },
    { type: "image", src: gallery2 },
    { type: "video", src: "/media/0804_4.mp4" },
    { type: "video", src: "/media/gallery-video.mp4" },
    { type: "image", src: gallery4 },
    { type: "video", src: "/media/0804_5.mp4" },
    { type: "video", src: "/media/IMG_6595.mp4" },
    { type: "video", src: "/media/0804_8.mp4" },
    { type: "video", src: "/media/0804_9.mp4" },
    { type: "video", src: "/media/0804_10.mp4" },
    { type: "video", src: "/media/IMG_5789_1.mp4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Media Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See our saunas in action and experience the joy our customers have shared with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item, index) => (
              <div key={index} className="overflow-hidden">
                {item.type === "image" ? (
                  <img
                    src={item.src}
                    alt={`SF Sauna ${index + 1}`}
                    loading="lazy"
                    className="w-full h-auto"
                  />
                ) : (
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto cursor-pointer"
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
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Media;
