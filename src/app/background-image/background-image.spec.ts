import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundImage } from './background-image';

describe('BackgroundImage', () => {
  let component: BackgroundImage;
  let fixture: ComponentFixture<BackgroundImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundImage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackgroundImage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
