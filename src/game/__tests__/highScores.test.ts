import {
  formatHighScoreDate,
  insertHighScore,
  MAX_HIGH_SCORES,
  parseHighScores,
  type HighScore,
} from '../highScores';

const DATE = '2026-10-19T12:00:00.000Z';
const hs = (score: number, level = 1, date = DATE): HighScore => ({
  score,
  level,
  date,
});

describe('parseHighScores', () => {
  it('null → []', () => {
    expect(parseHighScores(null)).toEqual([]);
  });

  it('JSON roto o forma no lista → []', () => {
    expect(parseHighScores('{no json')).toEqual([]);
    expect(parseHighScores('{"score":10}')).toEqual([]);
    expect(parseHighScores('42')).toEqual([]);
  });

  it('descarta entradas inválidas', () => {
    const raw = JSON.stringify([
      hs(100),
      null,
      { score: 0, level: 1, date: DATE },
      { score: 10.5, level: 1, date: DATE },
      { score: 50, level: 0, date: DATE },
      { score: 50, level: 1, date: 'no es fecha' },
      { score: '50', level: 1, date: DATE },
      hs(30, 2),
    ]);
    expect(parseHighScores(raw)).toEqual([hs(100), hs(30, 2)]);
  });

  it('ordena por puntos descendente y recorta a 5', () => {
    const raw = JSON.stringify([10, 70, 30, 60, 20, 50, 40].map((s) => hs(s)));
    const list = parseHighScores(raw);
    expect(list).toHaveLength(MAX_HIGH_SCORES);
    expect(list.map((h) => h.score)).toEqual([70, 60, 50, 40, 30]);
  });
});

describe('insertHighScore', () => {
  it('lista vacía → rank 0', () => {
    expect(insertHighScore([], hs(100))).toEqual({ list: [hs(100)], rank: 0 });
  });

  it('inserta en medio con el rank correcto', () => {
    const list = [hs(300), hs(200), hs(100)];
    const result = insertHighScore(list, hs(150, 2));
    expect(result.rank).toBe(2);
    expect(result.list.map((h) => h.score)).toEqual([300, 200, 150, 100]);
  });

  it('empate: la nueva queda debajo de la existente', () => {
    const old = hs(200, 1, '2026-01-01T00:00:00.000Z');
    const entry = hs(200, 3);
    const result = insertHighScore([hs(300), old, hs(100)], entry);
    expect(result.rank).toBe(2);
    expect(result.list[1]).toBe(old);
    expect(result.list[2]).toBe(entry);
  });

  it('recorta a 5 al insertar en lista llena', () => {
    const list = [500, 400, 300, 200, 100].map((s) => hs(s));
    const result = insertHighScore(list, hs(250));
    expect(result.rank).toBe(3);
    expect(result.list.map((h) => h.score)).toEqual([500, 400, 300, 250, 200]);
  });

  it('6.ª peor que las 5 (o empatada con la última) → rank null y lista igual', () => {
    const list = [500, 400, 300, 200, 100].map((s) => hs(s));
    expect(insertHighScore(list, hs(50))).toEqual({ list, rank: null });
    expect(insertHighScore(list, hs(100))).toEqual({ list, rank: null });
  });

  it('score 0 → rank null y lista igual', () => {
    const list = [hs(100)];
    expect(insertHighScore(list, hs(0))).toEqual({ list, rank: null });
  });
});

describe('formatHighScoreDate', () => {
  it('formatea dd/mm/aaaa en hora local', () => {
    const iso = new Date(2026, 9, 5, 12, 0, 0).toISOString();
    expect(formatHighScoreDate(iso)).toBe('05/10/2026');
  });
});
