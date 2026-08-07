import { Link } from "react-router-dom";

const AskQuestionCTA = ({ className = "", light = false }: { className?: string; light?: boolean }) => (
  <p className={`text-sm ${light ? "text-white/85" : "text-muted-foreground"} ${className}`}>
    Not sure if a sauna will fit your space?{" "}
    <Link
      to="/learn-more"
      className={`underline underline-offset-4 font-medium ${light ? "text-white hover:text-white/80" : "text-foreground hover:text-foreground/80"}`}
    >
      Ask a Question
    </Link>
  </p>
);

export default AskQuestionCTA;