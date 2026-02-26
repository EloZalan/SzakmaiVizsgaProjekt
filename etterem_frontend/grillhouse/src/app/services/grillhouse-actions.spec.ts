import { TestBed } from '@angular/core/testing';

import { GrillhouseActions } from './grillhouse-actions';

describe('GrillhouseActions', () => {
  let service: GrillhouseActions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrillhouseActions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
