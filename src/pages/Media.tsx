import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Media = () => {
  const videos = [
    { src: "/media/0804_1.mp4" },
    { src: "/media/IMG_6475_2.mp4" },
    { src: "/media/0804_3.mp4" },
    { src: "/media/IMG_6591.mp4" },
    { src: "/media/0804_4.mp4" },
    { src: "/media/0804_5.mp4" },
    { src: "/media/IMG_6595.mp4" },
    { src: "/media/0804_8.mp4" },
    { src: "/media/0804_9.mp4" },
    { src: "/media/0804_10.mp4" },
    { src: "/media/IMG_5789_1.mp4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Media Gallery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See our saunas in action and experience the joy our customers have shared with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <div key={index} className="overflow-hidden">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto"
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
                  <source src={video.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
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
