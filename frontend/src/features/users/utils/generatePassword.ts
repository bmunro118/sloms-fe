/**
 * Generates a random password that meets complexity requirements:
 * - Min 12 characters
 * - At least 2 uppercase, 2 lowercase, 2 digits, 2 special characters
 * - Excludes visually ambiguous characters (0/O, 1/l/I)
 */
export function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%*';
  const all = upper + lower + digits + special;

  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  const fill = Array.from({ length: 4 }, () => all[Math.floor(Math.random() * all.length)]);

  return [...required, ...fill].sort(() => Math.random() - 0.5).join('');
}
