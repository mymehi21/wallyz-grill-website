export const verifyEmail = async (email: string): Promise<{ valid: boolean; message: string }> => {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }

  // No DNS check - just accept the email
  return { valid: true, message: 'Email accepted' };
};
