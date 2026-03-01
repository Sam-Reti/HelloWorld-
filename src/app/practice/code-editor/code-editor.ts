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

@Component({
  selector: 'app-code-editor',
  standalone: true,
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.css',
})
export class CodeEditorComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;
  @Input() language: PracticeLanguage = 'JavaScript';
  @Input() initialCode = '';
  @Input() readonly = false;
  @Output() codeChange = new EventEmitter<string>();

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
