export const usePhoneFormatter = () => {
  const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    
    // Check if the phone already includes the country code "+998"
    // Remove all non-digit characters for processing
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length >= 12 && cleaned.startsWith('998')) {
      return `+998 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    } else if (cleaned.length === 9) {
      return `+998 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    }
    
    return phone;
  };

  return { formatPhone };
};
