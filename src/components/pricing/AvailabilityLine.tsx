import { formatDatePretty, type AvailabilityStatus } from "@/lib/availability";

interface Props {
  status: AvailabilityStatus;
  size?: "sm" | "md";
  label?: string;
}

const AvailabilityLine = ({ status, size = "sm", label }: Props) => {
  const textSize = size === "md" ? "text-base" : "text-sm";
  const labelNode = label ? <span className="font-bold text-foreground">{label}: </span> : null;

  if (status.status === "available") {
    return (
      <div className={textSize}>
        {labelNode}
        <span className="font-medium text-green-600 dark:text-green-500">Available immediately</span>
      </div>
    );
  }
  if (status.status === "future" && status.nextAvailableDate) {
    return (
      <div className={`${textSize} text-foreground`}>
        {labelNode}
        <span className="font-medium text-green-600 dark:text-green-500">
          Available {formatDatePretty(status.nextAvailableDate)}
        </span>
      </div>
    );
  }
  return (
    <div className={`${textSize} text-muted-foreground`}>
      {labelNode}Currently unavailable
    </div>
  );
};

export default AvailabilityLine;