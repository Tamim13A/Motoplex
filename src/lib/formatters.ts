export const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop";

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = Number(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-BD");
}

export function formatDateSafe(
  rawDate: string | number | Date | undefined | null,
  locale = "en-GB",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!rawDate) {
    try {
      return new Date().toLocaleDateString(locale, options);
    } catch {
      return "";
    }
  }

  if (typeof rawDate === "string") {
    const dmyMatch = rawDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      const parsed = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(parsed.getTime())) {
        try {
          return parsed.toLocaleDateString(locale, options);
        } catch {
          return `${d}/${m}/${y}`;
        }
      }
      return rawDate;
    }
  }

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    return String(rawDate);
  }

  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    return String(rawDate);
  }
}

export function getSafeImage(
  images: (string | undefined | null)[] | undefined | null,
  fallback = DEFAULT_PRODUCT_IMAGE
): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }
  const first = images[0];
  if (typeof first === "string" && first.trim().length > 0) {
    return first;
  }
  return fallback;
}

