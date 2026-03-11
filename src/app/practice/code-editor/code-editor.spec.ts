import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CodeEditorComponent } from './code-editor';

describe('CodeEditorComponent', () => {
  let component: CodeEditorComponent;
  let fixture: ComponentFixture<CodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CodeEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getLangExtension()', () => {
    it('should return javascript for JavaScript', () => {
      component.language = 'JavaScript';
      const ext = (component as any).getLangExtension();
      expect(ext).toBeDefined();
    });

    it('should return python for Python', () => {
      component.language = 'Python';
      const ext = (component as any).getLangExtension();
      expect(ext).toBeDefined();
    });

    it('should default to javascript for unknown language', () => {
      (component as any).language = 'Unknown';
      const ext = (component as any).getLangExtension();
      expect(ext).toBeDefined();
    });
  });
});
