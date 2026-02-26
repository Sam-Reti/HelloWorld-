import { Injectable } from '@angular/core';

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  accent: string;
}

const STORAGE_KEY = 'hw-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: Theme[] = [
    { id: 'clean',    name: 'Clean',    mode: 'light', accent: '#0ea5a4' },
    { id: 'ocean',    name: 'Ocean',    mode: 'light', accent: '#3b82f6' },
    { id: 'rose',     name: 'Rose',     mode: 'light', accent: '#e11d48' },
    { id: 'cyber',    name: 'Cyber',    mode: 'dark',  accent: '#00c4a0' },
    { id: 'midnight', name: 'Midnight', mode: 'dark',  accent: '#58a6ff' },
    { id: 'dracula',  name: 'Dracula',  mode: 'dark',  accent: '#bd93f9' },
  ];

  get lightThemes() { return this.themes.filter(t => t.mode === 'light'); }
  get darkThemes()  { return this.themes.filter(t => t.mode === 'dark');  }

  init(): void {
    this.apply(localStorage.getItem(STORAGE_KEY) ?? 'clean');
  }

  apply(id: string): void {
    document.body.setAttribute('data-theme', id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  current(): string {
    return document.body.getAttribute('data-theme') ?? 'clean';
  }
}
