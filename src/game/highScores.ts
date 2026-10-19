export interface HighScore {
  score: number; // entero > 0
  level: number; // 1-based, nivel en el que terminó la partida
  date: string; // ISO 8601, new Date().toISOString()
}

export const HIGH_SCORES_KEY = 'arkanoid:highScores:v1';
export const MAX_HIGH_SCORES = 5;

function isHighScore(value: unknown): value is HighScore {
  if (typeof value !== 'object' || value === null) return false;
  const { score, level, date } = value as Record<string, unknown>;
  return (
    Number.isInteger(score) &&
    (score as number) > 0 &&
    Number.isInteger(level) &&
    (level as number) >= 1 &&
    typeof date === 'string' &&
    !Number.isNaN(Date.parse(date))
  );
}

// JSON guardado → lista válida ordenada. null, JSON roto o forma inválida → [].
// Descarta entradas inválidas y recorta a MAX_HIGH_SCORES.
export function parseHighScores(raw: string | null): HighScore[] {
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data
    .filter(isHighScore)
    .map(({ score, level, date }) => ({ score, level, date }))
    .sort((a, b) => b.score - a.score) // estable: empates conservan su orden
    .slice(0, MAX_HIGH_SCORES);
}

// Inserta `entry` por puntos descendente (empate: debajo de las existentes) y recorta.
// rank = índice 0-based de la entrada en la lista resultante, o null si no entró o score es 0.
export function insertHighScore(
  list: HighScore[],
  entry: HighScore,
): { list: HighScore[]; rank: number | null } {
  if (entry.score <= 0) return { list, rank: null };
  const index = list.findIndex((h) => h.score < entry.score);
  const at = index === -1 ? list.length : index;
  if (at >= MAX_HIGH_SCORES) return { list, rank: null };
  const next = [...list.slice(0, at), entry, ...list.slice(at)].slice(
    0,
    MAX_HIGH_SCORES,
  );
  return { list: next, rank: at };
}

// ISO → 'dd/mm/aaaa' en hora local.
export function formatHighScoreDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
