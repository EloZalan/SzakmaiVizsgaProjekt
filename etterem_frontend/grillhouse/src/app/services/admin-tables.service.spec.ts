import { TestBed } from '@angular/core/testing';

import { AdminTablesService } from './admin-tables.service';

describe('AdminTablesService', () => {
  let service: AdminTablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminTablesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
