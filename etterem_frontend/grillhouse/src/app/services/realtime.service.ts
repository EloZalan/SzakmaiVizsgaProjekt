import { Injectable, inject } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { ConfigService } from './config.service';

export interface TableStatusChangedEvent {
  table_id: number;
  emitted_at: string;
}

export interface WaiterStatusChangedEvent {
  waiter_id: number;
  on_shift: boolean | null;
  action: string;
  emitted_at: string;
}

export interface MenuChangedEvent {
  entity: string;
  action: string;
  entity_id: number | null;
  emitted_at: string;
}

type WindowWithPusher = Window &
  typeof globalThis & {
    Pusher: typeof Pusher;
  };

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private readonly config = inject(ConfigService);
  private echo: Echo<'reverb'> | null = null;

  listenToTableStatusChanges(
    onEvent: (event: TableStatusChangedEvent) => void
  ): () => void {
    const echo = this.getEcho();
    const channel = echo.channel('tables');

    channel.listen('.table.status.changed', onEvent);

    return () => {
      channel.stopListening('.table.status.changed');
      echo.leave('tables');
    };
  }

  listenToWaiterStatusChanges(
    onEvent: (event: WaiterStatusChangedEvent) => void
  ): () => void {
    const echo = this.getEcho();
    const channel = echo.channel('waiters');

    channel.listen('.waiter.status.changed', onEvent);

    return () => {
      channel.stopListening('.waiter.status.changed');
      echo.leave('waiters');
    };
  }

  listenToMenuChanges(
    onEvent: (event: MenuChangedEvent) => void
  ): () => void {
    const echo = this.getEcho();
    const channel = echo.channel('menu');

    channel.listen('.menu.changed', onEvent);

    return () => {
      channel.stopListening('.menu.changed');
      echo.leave('menu');
    };
  }

  private getEcho(): Echo<'reverb'> {
    if (this.echo) {
      return this.echo;
    }

    (window as WindowWithPusher).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: this.config.reverbAppKey,
      wsHost: this.config.reverbHost,
      wsPort: this.config.reverbPort,
      wssPort: this.config.reverbPort,
      forceTLS: this.config.reverbScheme === 'https',
      enabledTransports: this.config.reverbScheme === 'https' ? ['wss'] : ['ws'],
    });

    return this.echo;
  }
}
