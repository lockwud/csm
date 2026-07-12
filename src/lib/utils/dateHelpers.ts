export function formatDate(value?: Date | string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
