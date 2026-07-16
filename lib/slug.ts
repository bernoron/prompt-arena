/**
 * Derives a URL-safe slug from a free-text label: lowercase, non-alphanumeric
 * runs collapsed to a single hyphen, leading/trailing hyphens trimmed.
 *
 * Pure/no dependencies so it stays unit-testable without pulling in Prisma —
 * used by lib/services/category-service.ts (CR-004, AC-02-013).
 */
export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
