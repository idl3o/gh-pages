/**
 * Sample test file demonstrating Jest testing patterns
 */

describe('Utility Functions', () => {
  test('adds two numbers correctly', () => {
    // Mock implementation of add function
    const add = (a, b) => a + b;

    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
    expect(add(5, 7)).toBe(12);
  });

  test('formats currency properly', () => {
    // Mock implementation of formatCurrency
    const formatCurrency = (amount, currency = 'USD') => {
      const symbols = {
        USD: '$',
        EUR: '€',
        GBP: '£'
      };

      const symbol = symbols[currency] || '$';
      return `${symbol}${amount.toFixed(2)}`;
    };

    expect(formatCurrency(10, 'USD')).toBe('$10.00');
    expect(formatCurrency(25.5, 'EUR')).toBe('€25.50');
    expect(formatCurrency(100, 'GBP')).toBe('£100.00');
  });

  test('validates email addresses', () => {
    // Mock implementation of isValidEmail
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('another@domain.co.uk')).toBe(true);
  });
});
