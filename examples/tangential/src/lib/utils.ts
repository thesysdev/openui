export const cn = (...values: Array<string | undefined | null | false>) =>
  values.filter(Boolean).join(" ");

export const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
