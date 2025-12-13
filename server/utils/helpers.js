import crypto from "crypto";

export const generateSecurePassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "#$%&*";
  const all = upper + lower + numbers + specials;

  const pick = (chars) => chars[crypto.randomInt(0, chars.length)];

  const password = [
    pick(upper), // 1 κεφαλαίο
    pick(numbers), // 1 αριθμός
    pick(specials), // 1 special
  ];

  // συμπλήρωση μέχρι 8
  while (password.length < 8) {
    password.push(pick(all));
  }

  // shuffle (crypto-safe)
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};
