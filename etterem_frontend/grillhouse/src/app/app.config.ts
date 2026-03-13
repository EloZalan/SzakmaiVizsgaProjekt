import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { routes } from './app.routes';

function initializeViewportScroller(scroller: ViewportScroller) {
  return () => scroller.setOffset([0, 72]);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeViewportScroller,
      deps: [ViewportScroller],
      multi: true,
    },
  ],
};
