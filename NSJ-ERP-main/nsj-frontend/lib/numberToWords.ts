/**
 * Convert a number to Indian currency words format
 * Uses Indian numbering system (lakhs, crores)
 */
export function amountInWords(amount: number): string {
  // Guards against 0, NaN and ±Infinity (the latter would otherwise recurse
  // forever and overflow the stack).
  if (!amount || !Number.isFinite(amount)) return "Zero Only";

  const absAmount = Math.abs(Math.round(amount));
  const words = numberToWordsIndian(absAmount);
  return `${words} Only`;
}

function numberToWordsIndian(num: number): string {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertBelowThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );
    }
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertBelowThousand(n % 100) : "")
    );
  }

  if (num < 1000) {
    return convertBelowThousand(num);
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertBelowThousand(thousands) + " Thousand";
    if (remainder > 0) result += " " + convertBelowThousand(remainder);
    return result;
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    let result = convertBelowThousand(lakhs) + " Lakh";
    if (remainder >= 1000) {
      result +=
        " " + convertBelowThousand(Math.floor(remainder / 1000)) + " Thousand";
      if (remainder % 1000 > 0)
        result += " " + convertBelowThousand(remainder % 1000);
    } else if (remainder > 0) {
      result += " " + convertBelowThousand(remainder);
    }
    return result;
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    // Use the full converter for the crore count so values of a thousand crore
    // or more read correctly (e.g. "One Thousand Crore", "One Lakh Crore")
    // instead of breaking convertBelowThousand, which only handles 0-999.
    let result = numberToWordsIndian(crores) + " Crore";
    if (remainder >= 100000) {
      result +=
        " " + convertBelowThousand(Math.floor(remainder / 100000)) + " Lakh";
      let rem = remainder % 100000;
      if (rem >= 1000) {
        result +=
          " " + convertBelowThousand(Math.floor(rem / 1000)) + " Thousand";
        rem = rem % 1000;
        if (rem > 0) result += " " + convertBelowThousand(rem);
      } else if (rem > 0) {
        result += " " + convertBelowThousand(rem);
      }
    } else if (remainder >= 1000) {
      result +=
        " " + convertBelowThousand(Math.floor(remainder / 1000)) + " Thousand";
      const rem = remainder % 1000;
      if (rem > 0) result += " " + convertBelowThousand(rem);
    } else if (remainder > 0) {
      result += " " + convertBelowThousand(remainder);
    }
    return result;
  }
}
