import { TestBed } from '@angular/core/testing';

import { Postservice } from './postservice';

describe('Postservice', () => {
  let service: Postservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Postservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
