import { cn } from "@/lib/utils";
import { contactInitial } from "@/lib/contacts/appearance";

export function ContactAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string | null;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-sm font-medium text-primary-foreground",
        size === "sm" ? "size-8 text-xs" : "size-10",
      )}
      style={{ background: color || "#6B7C93" }}
      aria-hidden
    >
      {contactInitial(name)}
    </span>
  );
}
