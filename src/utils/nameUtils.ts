/**
 * Utility function to truncate user profile names
 * Examples:
 * - "Rigel Ramadhani W." → "Rigel R."
 * - "Annastasia Doe Keys" → "Annastasia D."
 * - "John" → "John" (single name stays as is)
 * - "Mary Jane Watson Smith" → "Mary J." (first name + first letter of second name)
 */
export function truncateProfileName(
  fullName: string | undefined | null,
): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'User';
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return 'User';
  }

  const nameParts = trimmedName.split(/\s+/);

  // If only one name, return as is
  if (nameParts.length === 1) {
    return nameParts[0];
  }

  // If two or more names, return first name + first letter of second name + "."
  const firstName = nameParts[0];
  const secondNameInitial = nameParts[1].charAt(0).toUpperCase();

  return `${firstName} ${secondNameInitial}.`;
}
