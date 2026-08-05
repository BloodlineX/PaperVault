import type { CSSProperties } from 'react';

export type SemesterColor = {
  base: string;
  light: string;
  lighter: string;
  dark: string;
  name: string;
};

// One colour family per semester — base (accents/borders), light (fills),
// lighter (zebra tint), dark (text). Keep in sync with the prototype.
export const semesterColors: Record<number, SemesterColor> = {
  1: { base: '#4C5FD6', light: '#E3E6FB', lighter: '#F1F2FD', dark: '#2E3A99', name: 'Indigo' },
  2: { base: '#14B8A6', light: '#D8F5F0', lighter: '#EFFBF9', dark: '#0B6B60', name: 'Teal' },
  3: { base: '#F59E0B', light: '#FDF0D5', lighter: '#FFF8EA', dark: '#92600A', name: 'Amber' },
  4: { base: '#DB2777', light: '#FBE0EE', lighter: '#FDF0F6', dark: '#921356', name: 'Pink' },
  5: { base: '#0EA5E9', light: '#DCF0FB', lighter: '#EFF8FD', dark: '#075E86', name: 'Sky Blue' },
  6: { base: '#65A30D', light: '#E8F3D5', lighter: '#F5FAEA', dark: '#3F6608', name: 'Lime' },
  7: { base: '#EA580C', light: '#FDE3D3', lighter: '#FEF1E7', dark: '#9A3A08', name: 'Orange' },
  8: { base: '#9333EA', light: '#F0E0FB', lighter: '#F8EFFD', dark: '#5B1E92', name: 'Violet' },
};

export function semStyle(semester: number): CSSProperties {
  const c = semesterColors[semester] || semesterColors[1];
  return {
    ['--sc-base' as string]: c.base,
    ['--sc-light' as string]: c.light,
    ['--sc-lighter' as string]: c.lighter,
    ['--sc-dark' as string]: c.dark,
  };
}
