export enum TreeMode {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export interface HandData {
  state: 'OPEN' | 'CLOSED' | 'POINTING' | 'NONE';
  x: number;
  y: number;
}

export interface PhotoData {
  id: string;
  url: string;
  aspectRatio: number;
}
