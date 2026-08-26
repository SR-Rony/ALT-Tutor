export { cn } from "./cn";
export {
  compareByOrderThenNaturalTitle,
  compareNaturalTitle,
  leadingSerialNumber,
} from "./natural-sort";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
