/**
 * Safely serializes a Prisma BigInt to a standard JavaScript Number.
 * Ensures the value is within the safe integer limit (9,007,199,254,740,991).
 * For a personal finance app storing minor units (cents), this allows up to $90 trillion.
 */
import { assertMinor } from '../money';

export function toMoneyDTO(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return assertMinor(value);
}

/**
 * Safely serializes a Prisma Date to an ISO string for transmission over the network boundary.
 * Next.js Server Components passing props to Client Components should avoid raw Dates where possible,
 * to prevent hydration mismatches and edge-case serialization bugs.
 */
export function toDateDTO(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}
