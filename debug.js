const s1 = "FG7K2X8L Confirmed. Ksh1,500.00 sent to JOHN KAMAU 0722XXXXXX on 27/5/25 at 3:14 PM.";
console.log('1:', /^([A-Z0-9]{10})\s+Confirmed\./i.exec(s1));
console.log('2:', /^([A-Z0-9]{10})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)/i.exec(s1));
console.log('3:', /^([A-Z0-9]{10})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+sent/i.exec(s1));
console.log('4:', /^([A-Z0-9]{10})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+sent\s+to\s+(.+?)/i.exec(s1));
console.log('5:', /^([A-Z0-9]{10})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+sent\s+to\s+(.+?)(?:\s+[\dX]+)?\s+on\s+([\d/]+)/i.exec(s1));

