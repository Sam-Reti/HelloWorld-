import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = new MarkdownPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should render bold markdown as <strong>', () => {
    const result = pipe.transform('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('should render italic markdown as <em>', () => {
    const result = pipe.transform('*italic*');
    expect(result).toContain('<em>italic</em>');
  });

  it('should render inline code', () => {
    const result = pipe.transform('`code`');
    expect(result).toContain('<code>code</code>');
  });

  it('should strip XSS script tags via DOMPurify', () => {
    const result = pipe.transform('<script>alert("xss")</script>hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('hello');
  });

  it('should strip onerror attributes via DOMPurify', () => {
    const result = pipe.transform('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain('onerror');
  });

  it('should return cached result for same input', () => {
    const first = pipe.transform('**test**');
    const second = pipe.transform('**test**');
    expect(first).toBe(second); // same reference (from cache)
  });
});
