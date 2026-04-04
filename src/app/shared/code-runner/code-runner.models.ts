export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info';

export interface ConsoleEntry {
  level: ConsoleLevel;
  args: string[];
  timestamp: number;
}
