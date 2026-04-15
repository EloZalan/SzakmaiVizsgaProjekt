import { TestBed } from '@angular/core/testing';

import { GrillhouseActionsService } from './grillhouse-actions';

describe('GrillhouseActionsService', () => {
  let service: GrillhouseActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrillhouseActionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle full menu visibility', () => {
    expect(service.isFullMenuVisible()).toBe(false);

    service.viewFullMenu();
    expect(service.isFullMenuVisible()).toBe(true);

    service.viewFullMenu();
    expect(service.isFullMenuVisible()).toBe(false);
  });

  it('should scroll to menu section when present', () => {
    const menuElement = document.createElement('div');
    const scrollSpy = vi.fn();
    Object.defineProperty(menuElement, 'scrollIntoView', {
      value: scrollSpy,
      configurable: true,
      writable: true,
    });
    vi.spyOn(document, 'getElementById').mockReturnValue(menuElement);

    service.viewMenu();

    expect(document.getElementById).toHaveBeenCalledWith('menu');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should open google maps with encoded destination and selected mode', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    service.getDirections('walking');

    expect(openSpy).toHaveBeenCalled();
    const [url, target] = openSpy.mock.calls[0];
    expect(String(url)).toContain('https://www.google.com/maps/dir/?api=1');
    expect(String(url)).toContain('travelmode=walking');
    expect(target).toBe('_blank');

    openSpy.mockRestore();
  });
});
