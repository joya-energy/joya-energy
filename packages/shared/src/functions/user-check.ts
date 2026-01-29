export const validateEmail = (email: string): boolean => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const clean = String(phoneNumber)
    .trim()
    .replace(/\s+/g, '') // remove spaces
    .replace(/[^\d+]/g, ''); // remove weird non-digit chars

  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(clean);
};
