import googleReviewsImage from "@/assets/google-reviews.png";

const GoogleReviews = () => {
  return (
    <section className="w-full">
      <img 
        src={googleReviewsImage} 
        alt="Customer reviews from Google showing 5-star ratings and testimonials from satisfied SF Sauna customers"
        className="w-full h-auto"
      />
    </section>
  );
};

export default GoogleReviews;
