import { Component, OnInit } from '@angular/core';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
})
export class FooterComponent implements OnInit {
  currentLanguage: Language = 'hu';

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }
}