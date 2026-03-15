import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  readonly apiUrl = 'http://localhost:8000/api';
  readonly reverbAppKey = 'eeg1kkhwvkbisqfi5say';
  readonly reverbHost = 'localhost';
  readonly reverbPort = 8080;
  readonly reverbScheme: 'http' | 'https' = 'http';
}
