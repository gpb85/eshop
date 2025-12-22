import crypto from "crypto";
import pool from "./../config/pool.js";
import { orderTransitions } from "./orderTransitions.js";

export const generateSecurePassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "#$%&*";
  const all = upper + lower + numbers + specials;

  const pick = (chars) => chars[crypto.randomInt(0, chars.length)];

  const password = [
    pick(upper),
    pick(numbers),
    pick(specials), //
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
export const generateSKU = async (name, category = "GEN") => {
  // Παίρνουμε τα πρώτα 3 γράμματα του category
  const cat = category.slice(0, 3).toUpperCase();
  // Παίρνουμε τα πρώτα 3 γράμματα του name
  const prod = name.replace(/\s+/g, "").slice(0, 3).toUpperCase();
  // Προσθέτουμε ένα τυχαίο 4-ψήφιο αριθμό
  const random = Math.floor(1000 + Math.random() * 900000);
  return `${cat}-${prod}-${random}`;
};

// order status helper
