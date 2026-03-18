import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { GrillhouseActionsService, TravelMode } from '../../services/grillhouse-actions';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-visit-us',
  standalone: true,
  imports: [NgIf],
  templateUrl: './visit-us.html',
})
export class VisitUsComponent implements OnInit {
  showDirectionsModal = false;
  currentLanguage: Language = 'hu';

  constructor(
    private actions: GrillhouseActionsService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  onGetDirections(): void {
    this.showDirectionsModal = true;
  }

  closeDirectionsModal(): void {
    this.showDirectionsModal = false;
  }

  selectTravelMode(mode: TravelMode): void {
    this.actions.getDirections(mode);
    this.closeDirectionsModal();
  }
}