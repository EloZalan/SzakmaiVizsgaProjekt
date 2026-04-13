import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ReservePageComponent } from '../reserve-page/reserve-page';
import { LanguageService, Language } from '../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-reserve-modal',
  standalone: true,
  imports: [ReservePageComponent],
  templateUrl: './home-reserve-modal.html',
  styleUrl: './home-reserve-modal.css',
})
export class HomeReserveModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() closeRequested = new EventEmitter<void>();
  currentLanguage: Language = 'hu';
  private languageSubscription?: Subscription;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.currentLanguage = this.languageService.currentLanguageValue;
    this.languageSubscription = this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  requestClose(): void {
    this.closeRequested.emit();
  }
}
