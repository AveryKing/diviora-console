export interface DiffStats {
  added: number;
  removed: number;
}

export function computeCharDiffStats(original: string, modified: string): DiffStats {
  const charCount1 = countChars(original);
  const charCount2 = countChars(modified);
  
  let added = 0;
  let removed = 0;
  
  const allChars = new Set([...Object.keys(charCount1), ...Object.keys(charCount2)]);
  
  allChars.forEach(char => {
    const c1 = charCount1[char] || 0;
    const c2 = charCount2[char] || 0;
    if (c2 > c1) {
      added += c2 - c1;
    } else {
      removed += c1 - c2;
    }
  });

  return { added, removed };
}

function countChars(str: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const char of str) {
    counts[char] = (counts[char] || 0) + 1;
  }
  return counts;
}
