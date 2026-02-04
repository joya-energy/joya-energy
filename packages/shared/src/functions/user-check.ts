export const validateEmail = (email: string): boolean => {
  if (email == null || typeof email !== 'string') return false;
  const re = /\S+@\S+\.\S+/;
  return re.test(String(email).trim());
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  if (phoneNumber == null || typeof phoneNumber !== 'string') return false;
  const clean = String(phoneNumber)
    .trim()
    .replace(/\s+/g, '') // remove spaces
    .replace(/[^\d+]/g, ''); // remove weird non-digit chars

  // Allow international format (+...) OR local format (0... or just digits 8+)
  // The user entered "51845578" which is 8 digits but doesn't start with 0 or +
  // Tunisian numbers are often written as 8 digits (e.g., 22 123 456) or +216...
  // Let's allow:
  // 1. Starts with + (international) -> 8 to 15 digits after +
  // 2. Starts with 0 (local with prefix) -> 9 to 14 digits total
  // 3. Just digits (local without prefix) -> exactly 8 digits (Tunisian standard)

  const re = /^(\+|00)[1-9][0-9]{7,14}$|^0[1-9][0-9]{8,10}$|^[1-9][0-9]{7}$/;
  return re.test(clean);
};
