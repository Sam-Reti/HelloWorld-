import {
  Component,
  ElementRef,
  ViewChild,
  afterNextRender,
  input,
  output,
} from '@angular/core';
import { ConsoleEntry } from './code-runner.models';

@Component({
  selector: 'app-console-output',
  standalone: true,
  templateUrl: './console-output.html',
  styleUrl: './console-output.css',
})
export class ConsoleOutputComponent {
  readonly entries = input<ConsoleEntry[]>([]);
  readonly alwaysShow = input(false);
  readonly fillHeight = input(false);
  readonly cleared = output<void>();

  @ViewChild('consoleBody') consoleBody?: ElementRef<HTMLDivElement>;

  constructor() {
    afterNextRender(() => this.scrollToBottom());
  }

  onClear(): void {
    this.cleared.emit();
  }

  private scrollToBottom(): void {
    const el = this.consoleBody?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
