export const verifyEmail = async (email: string): Promise<{ valid: boolean; message: string }> => {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }

  const domain = email.split('@')[1];

  const commonDisposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'trashmail.com', 'fakeinbox.com', 'yopmail.com',
    'temp-mail.org', 'getnada.com', 'maildrop.cc'
  ];

  if (commonDisposableDomains.includes(domain.toLowerCase())) {
    return { valid: false, message: 'Disposable email addresses are not allowed' };
  }

  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const data = await response.json();

    if (!data.Answer || data.Answer.length === 0) {
      return { valid: false, message: 'Email domain does not exist or has no mail servers' };
    }

    return { valid: true, message: 'Email verified' };
  } catch (error) {
    console.warn('DNS check failed, allowing email:', error);
    return { valid: true, message: 'Email accepted' };
  }
};
