export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  timestamp: number;
}

export interface CalculatorState {
  display: string;
  result: string;
  history: string[];
}

export enum CalcMode {
  DEG = 'DEG',
  RAD = 'RAD',
}
