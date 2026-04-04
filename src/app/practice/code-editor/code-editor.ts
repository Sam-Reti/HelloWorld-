import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  ViewChild,
  SimpleChanges,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { cpp } from '@codemirror/lang-cpp';
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import { csharp } from '@codemirror/legacy-modes/mode/clike';
import { PracticeLanguage } from '../practice.models';
import { CodeRunnerService } from '../../shared/code-runner/code-runner.service';
import { ConsoleOutputComponent } from '../../shared/code-runner/console-output';
import { ConsoleEntry } from '../../shared/code-runner/code-runner.models';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [ConsoleOutputComponent],
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.css',
  host: { '[class.fill-height]': 'fillHeight' },
})
export class CodeEditorComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;
  @Input() language: PracticeLanguage = 'JavaScript';
  @Input() initialCode = '';
  @Input() readonly = false;
  @Input() showRun = false;
  @Input() fillHeight = false;
  @Output() codeChange = new EventEmitter<string>();

  private codeRunner = inject(CodeRunnerService);
  consoleEntries = signal<ConsoleEntry[]>([]);
  running = signal(false);

  private view?: EditorView;

  ngOnInit() {
    this.mountEditor(this.initialCode);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.view) return;
    if (changes['language'] && !changes['language'].firstChange) {
      const currentCode = this.view.state.doc.toString();
      this.view.destroy();
      this.mountEditor(currentCode);
    }
  }

  ngOnDestroy() {
    this.view?.destroy();
  }

  get canRun(): boolean {
    return this.showRun && (this.language === 'JavaScript' || this.language === 'TypeScript');
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.canRun) return;
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.runCode();
    }
  }

  async runCode(): Promise<void> {
    if (!this.canRun || this.running()) return;
    this.running.set(true);
    this.consoleEntries.set([]);
    const code = this.getCode();
    const entries = await this.codeRunner.run(code, this.language === 'TypeScript');
    this.consoleEntries.set(entries);
    this.running.set(false);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  getCode(): string {
    return this.view?.state.doc.toString() ?? '';
  }

  private mountEditor(code: string) {
    const langExtension = this.getLangExtension();
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        this.codeChange.emit(update.state.doc.toString());
      }
    });

    const extensions = [basicSetup, oneDark, langExtension];
    if (this.readonly) {
      extensions.push(EditorState.readOnly.of(true));
    } else {
      extensions.push(updateListener);
    }

    this.view = new EditorView({
      state: EditorState.create({ doc: code, extensions }),
      parent: this.editorHost.nativeElement,
    });
  }

  private getLangExtension() {
    switch (this.language) {
      case 'JavaScript':
      case 'TypeScript':
        return javascript({ typescript: this.language === 'TypeScript' });
      case 'Python':
        return python();
      case 'Java':
        return java();
      case 'Rust':
        return rust();
      case 'C++':
        return cpp();
      case 'Go':
        return StreamLanguage.define(go);
      case 'C#':
        return StreamLanguage.define(csharp);
      default:
        return javascript();
    }
  }
}
