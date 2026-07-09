import { formatDatePretty, type AvailabilityStatus } from "@/lib/availability";

interface Props {
  status: AvailabilityStatus;
  size?: "sm" | "md";
}

const AvailabilityLine = ({ status, size = "sm" }: Props) => {
  const textSize = size === "md" ? "text-base" : "text-sm";

  if (status.status === "available") {
    return (
      <div className={`inline-flex items-center gap-2 ${textSize} font-medium text-primary`}>
        <span className="w-2 h-2 rounded-full bg-primary" />
        Available immediately
      </div>
    );
  }
  if (status.status === "future" && status.nextAvailableDate) {
    return (
      <div className={`${textSize} text-foreground`}>
        <span className="text-muted-foreground">Next available: </span>
        <span className="font-medium">{formatDatePretty(status.nextAvailableDate)}</span>
      </div>
    );
  }
  return <div className={`${textSize} text-muted-foreground`}>Currently unavailable</div>;
};

export default AvailabilityLine;