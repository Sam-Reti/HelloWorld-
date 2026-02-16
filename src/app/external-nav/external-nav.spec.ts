import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalNav } from './external-nav';

describe('ExternalNav', () => {
  let component: ExternalNav;
  let fixture: ComponentFixture<ExternalNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalNav]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalNav);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
