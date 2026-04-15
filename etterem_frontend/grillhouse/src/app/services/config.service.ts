import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  readonly apiUrl = 'https://jcloud02.jedlik.eu/schmitzhofer.pal/backend/api';
}
