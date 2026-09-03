/**
 * Formats user initials for avatar display.
 * For Arabic names (e.g. "سلمى محمد"), formats with a separating space ("س م")
 * so Arabic letters remain isolated and do not connect cursively.
 * For Latin names (e.g. "Yousef Dawood"), formats as uppercase initials ("YD").
 */
export const getInitials = (name?: string): string => {
  if (!name) return 'DH';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DH';

  const isArabic = /[\u0600-\u06FF]/.test(clean);

  if (isArabic) {
    if (parts.length >= 2) {
      return `${parts[0][0]} ${parts[1][0]}`;
    }
    return parts[0][0];
  }

  // English / Latin
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};
