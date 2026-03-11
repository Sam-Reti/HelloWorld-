import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CodePostCardComponent } from './code-post-card';

describe('CodePostCardComponent', () => {
  let component: CodePostCardComponent;
  let fixture: ComponentFixture<CodePostCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodePostCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CodePostCardComponent);
    component = fixture.componentInstance;
    component.post = {
      text: '', authorId: 'u1', authorName: 'Test', createdAt: new Date(),
      likeCount: 0, commentCount: 0, type: 'code',
      codeLanguage: 'TypeScript', codeContent: 'const x = 1;',
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('language getter', () => {
    it('should return the post codeLanguage', () => {
      expect(component.language).toBe('TypeScript');
    });

    it('should default to JavaScript when not set', () => {
      component.post = { ...component.post, codeLanguage: undefined } as any;
      expect(component.language).toBe('JavaScript');
    });
  });
});
