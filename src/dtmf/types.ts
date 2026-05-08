export type DTMFDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'A' | 'B' | 'C' | 'D' | '*' | '#';

export interface DetectionEvent {
  digit: DTMFDigit;
  timestamp: number;
  lowFreq: number;
  highFreq: number;
  confidence: number;
}

export interface DTMFFreqPair {
  low: number;
  high: number;
}

export type InputMode = 'file' | 'mic' | 'sample';
