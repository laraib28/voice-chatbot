const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

const ROMAN_URDU_WORDS = new Set([
  "mujhe", "muje", "hai", "hain", "kya", "aur", "nahi", "nahin", "ho", "kar",
  "raha", "rahi", "tha", "thi", "the", "se", "ki", "ka", "ke", "ko", "me",
  "mein", "bhi", "toh", "to", "jo", "jab", "kab", "kahan", "kyun", "kyunke",
  "batao", "bata", "chahiye", "chahta", "chahti", "karo", "karna", "wala",
  "wali", "wale", "abhi", "phir", "agar", "lekin", "acha", "accha", "theek",
  "shukriya", "shukria", "ap", "aap", "main", "hum", "tum", "woh", "yeh",
  "course", "courses", "seekhna", "sikhna", "padhai", "taleem", "school",
]);

export function detectLanguage(text: string): "en" | "ur" | "roman_ur" {
  if (!text || text.trim().length === 0) return "en";

  // Urdu in Arabic/Nastaliq script
  if (ARABIC_SCRIPT_REGEX.test(text)) return "ur";

  // Roman Urdu heuristic
  const words = text.toLowerCase().split(/\s+/);
  const romanUrduMatches = words.filter((w) => ROMAN_URDU_WORDS.has(w)).length;
  const matchRatio = words.length > 0 ? romanUrduMatches / words.length : 0;

  if (matchRatio >= 0.2 || romanUrduMatches >= 2) return "roman_ur";

  return "en";
}

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ur: "اردو",
  roman_ur: "Roman Urdu",
};
