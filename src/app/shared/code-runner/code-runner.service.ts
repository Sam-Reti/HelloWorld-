import { Injectable } from '@angular/core';
import { ConsoleEntry, ConsoleLevel } from './code-runner.models';

const TIMEOUT_MS = 5000;

const SANDBOX_HTML = `<!DOCTYPE html>
<html><head><script>
(function() {
  const LEVELS = ['log', 'warn', 'error', 'info'];
  LEVELS.forEach(function(level) {
    console[level] = function() {
      var args = [];
      for (var i = 0; i < arguments.length; i++) {
        try { args.push(typeof arguments[i] === 'object' ? JSON.stringify(arguments[i]) : String(arguments[i])); }
        catch(e) { args.push('[unserializable]'); }
      }
      parent.postMessage({ type: 'console', level: level, args: args }, '*');
    };
  });
  window.onerror = function(msg) {
    parent.postMessage({ type: 'console', level: 'error', args: [String(msg)] }, '*');
  };
  window.addEventListener('unhandledrejection', function(e) {
    parent.postMessage({ type: 'console', level: 'error', args: ['Unhandled rejection: ' + String(e.reason)] }, '*');
  });
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'run') {
      try { new Function(e.data.code)(); }
      catch(err) { parent.postMessage({ type: 'console', level: 'error', args: [String(err)] }, '*'); }
      parent.postMessage({ type: 'done' }, '*');
    }
  });
  parent.postMessage({ type: 'ready' }, '*');
})();
<\/script></head><body></body></html>`;

@Injectable({ providedIn: 'root' })
export class CodeRunnerService {
  run(code: string, isTypeScript = false): Promise<ConsoleEntry[]> {
    const executableCode = isTypeScript ? this.stripTypeAnnotations(code) : code;

    return new Promise<ConsoleEntry[]>((resolve) => {
      const entries: ConsoleEntry[] = [];
      const iframe = document.createElement('iframe');
      iframe.sandbox.add('allow-scripts');
      iframe.style.display = 'none';
      iframe.srcdoc = SANDBOX_HTML;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener('message', onMessage);
        iframe.remove();
        resolve(entries);
      };

      const timeout = setTimeout(() => {
        entries.push({
          level: 'error',
          args: ['Execution timed out (5 s limit)'],
          timestamp: Date.now(),
        });
        finish();
      }, TIMEOUT_MS);

      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        const data = event.data;
        if (!data || typeof data.type !== 'string') return;

        if (data.type === 'ready') {
          iframe.contentWindow!.postMessage({ type: 'run', code: executableCode }, '*');
          return;
        }
        if (data.type === 'console') {
          entries.push({
            level: data.level as ConsoleLevel,
            args: data.args as string[],
            timestamp: Date.now(),
          });
          return;
        }
        if (data.type === 'done') {
          clearTimeout(timeout);
          finish();
        }
      };

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
    });
  }

  private stripTypeAnnotations(code: string): string {
    let result = code;
    // Remove interface/type blocks
    result = result.replace(/^(export\s+)?(interface|type)\s+\w[\w<>,\s]*\{[^}]*\}/gm, '');
    result = result.replace(/^(export\s+)?type\s+\w+\s*=[^;\n]+;?/gm, '');
    // Remove type assertions (as Type)
    result = result.replace(/\s+as\s+\w[\w[\]<>,\s|]*/g, '');
    // Remove angle-bracket type params on functions/classes
    result = result.replace(/<\s*[A-Z][\w\s,]*>/g, '');
    // Remove parameter type annotations (: Type) — careful with ternaries
    result = result.replace(/:\s*(?:readonly\s+)?[A-Z][\w[\]<>,\s|]*(?=[,)\]=\n{])/g, '');
    // Remove return type annotations
    result = result.replace(/\):\s*(?:readonly\s+)?[A-Z][\w[\]<>,\s|]*\s*(?=[{=>])/g, ') ');
    // Remove non-null assertions
    result = result.replace(/!/g, '');
    // Remove access modifiers
    result = result.replace(/\b(public|private|protected|readonly)\s+/g, '');
    return result;
  }
}
