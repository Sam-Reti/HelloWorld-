import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  effect,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { SharedEditorService } from './shared-editor.service';
import { EditorLanguage, EDITOR_LANGUAGES } from './shared-editor.models';
import { CodeRunnerService } from '../../shared/code-runner/code-runner.service';
import { ConsoleOutputComponent } from '../../shared/code-runner/console-output';
import { ConsoleEntry } from '../../shared/code-runner/code-runner.models';

@Component({
  selector: 'app-shared-editor',
  standalone: true,
  imports: [FormsModule, ConsoleOutputComponent],
  templateUrl: './shared-editor.html',
  styleUrl: './shared-editor.css',
})
export class SharedEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  readonly close = output<void>();
  readonly service = inject(SharedEditorService);
  readonly languages = EDITOR_LANGUAGES;

  private codeRunner = inject(CodeRunnerService);
  consoleEntries = signal<ConsoleEntry[]>([]);
  running = signal(false);

  private view?: EditorView;
  private suppressOutgoing = false;

  constructor() {
    effect(() => {
      const content = this.service.remoteContent();
      this.applyRemoteContent(content);
    });

    effect(() => {
      const lang = this.service.language();
      if (this.view) {
        const currentCode = this.view.state.doc.toString();
        this.view.destroy();
        this.mountEditor(currentCode, lang);
      }
    });
  }

  ngOnInit(): void {
    this.mountEditor('', this.service.language());
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }

  onLanguageChange(lang: EditorLanguage): void {
    this.service.setLanguage(lang);
  }

  onClose(): void {
    this.service.toggleEditor();
    this.close.emit();
  }

  get canRun(): boolean {
    const lang = this.service.language();
    return lang === 'JavaScript' || lang === 'TypeScript';
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
    const code = this.view?.state.doc.toString() ?? '';
    const entries = await this.codeRunner.run(code, this.service.language() === 'TypeScript');
    this.consoleEntries.set(entries);
    this.running.set(false);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private mountEditor(code: string, language: EditorLanguage): void {
    const langExtension = this.getLangExtension(language);
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !this.suppressOutgoing) {
        this.service.sendEdit(update.state.doc.toString());
      }
    });

    this.view = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: [basicSetup, oneDark, langExtension, updateListener],
      }),
      parent: this.editorHost.nativeElement,
    });
  }

  private applyRemoteContent(content: string): void {
    if (!this.view) return;
    const current = this.view.state.doc.toString();
    if (content === current) return;
    this.suppressOutgoing = true;
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content },
    });
    this.suppressOutgoing = false;
  }

  private getLangExtension(language: EditorLanguage) {
    switch (language) {
      case 'JavaScript':
      case 'TypeScript':
        return javascript({ typescript: language === 'TypeScript' });
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
