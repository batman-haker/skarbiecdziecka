/**
 * Withdrawal Password Security
 *
 * Generates a 4-word passphrase during treasury creation.
 * User must enter this passphrase to withdraw funds.
 *
 * Security:
 * - Passphrase shown ONCE at creation (user must save it)
 * - Only bcrypt hash stored in database
 * - No password reset (by design - maximum security)
 */

import bcrypt from 'bcryptjs';

// Polish word list for passphrase generation (easy to remember)
const POLISH_WORDS = [
  // Zwierzęta
  'kot', 'pies', 'ryba', 'ptak', 'koń', 'krowa', 'owca', 'koza', 'świnia', 'kura',
  'żaba', 'mysz', 'wilk', 'lis', 'sowa', 'orzeł', 'motyl', 'pszczoła', 'mrówka',
  // Dom i rodzina
  'dom', 'mama', 'tata', 'brat', 'siostra', 'babcia', 'dziadek', 'ciocia', 'wujek',
  'okno', 'drzwi', 'stół', 'krzesło', 'łóżko', 'lampa', 'dywan', 'lustro',
  // Natura
  'drzewo', 'kwiat', 'trawa', 'liść', 'słońce', 'księżyc', 'gwiazda', 'chmura',
  'deszcz', 'śnieg', 'wiatr', 'rzeka', 'morze', 'góra', 'las', 'pole',
  // Jedzenie
  'chleb', 'masło', 'ser', 'mleko', 'jabłko', 'gruszka', 'banan', 'pomarańcza',
  'pomidor', 'ogórek', 'marchew', 'ziemniak', 'ryż', 'makaron', 'zupa', 'ciasto',
  // Kolory
  'czerwony', 'niebieski', 'zielony', 'żółty', 'biały', 'czarny', 'różowy', 'fioletowy',
  // Transport
  'auto', 'rower', 'autobus', 'tramwaj', 'pociąg', 'samolot', 'statek', 'rakieta',
  // Przedmioty
  'książka', 'długopis', 'telefon', 'zegarek', 'parasol', 'torba', 'klucz', 'moneta',
  // Miejsca
  'szkoła', 'sklep', 'park', 'plaża', 'kino', 'muzeum', 'stadion', 'basen',
  // Inne
  'serce', 'uśmiech', 'muzyka', 'taniec', 'zabawa', 'marzenie', 'przygoda', 'sekret',
];

/**
 * Generate a random 4-word passphrase
 * Example: "kot-rower-słońce-książka"
 */
export function generatePassphrase(): string {
  const words: string[] = [];
  const usedIndexes = new Set<number>();

  while (words.length < 4) {
    const randomIndex = Math.floor(Math.random() * POLISH_WORDS.length);
    if (!usedIndexes.has(randomIndex)) {
      usedIndexes.add(randomIndex);
      words.push(POLISH_WORDS[randomIndex]);
    }
  }

  return words.join('-');
}

/**
 * Hash a passphrase using bcrypt
 * @param passphrase - Plain text passphrase
 * @returns Bcrypt hash
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  const saltRounds = 12; // High security
  return bcrypt.hash(passphrase, saltRounds);
}

/**
 * Verify a passphrase against a hash
 * @param passphrase - Plain text passphrase to verify
 * @param hash - Stored bcrypt hash
 * @returns True if passphrase matches
 */
export async function verifyPassphrase(passphrase: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passphrase, hash);
}

/**
 * Validate passphrase format (4 words separated by dashes)
 */
export function isValidPassphraseFormat(passphrase: string): boolean {
  if (!passphrase || typeof passphrase !== 'string') return false;

  const words = passphrase.toLowerCase().trim().split('-');
  if (words.length !== 4) return false;

  // Each word should be at least 2 characters
  return words.every(word => word.length >= 2);
}
