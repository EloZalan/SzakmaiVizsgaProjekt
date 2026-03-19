import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import { AdminTablesService } from '../../services/admin-tables.service';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.css',
})
export class AdminStatsComponent implements OnInit {
  loading = false;
  error = '';

  dailyRevenue = 0;
  todayGuests = 0;
  activeWaiters = 0;
  totalTables = 0;

  constructor(
    private adminDashboardService: AdminDashboardService,
    private adminTablesService: AdminTablesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      waiters: this.adminDashboardService.getWaiters(),
      todayGuests: this.adminDashboardService.getTodayGuestCount(),
      tables: this.adminTablesService.getTables(),
      dailyRevenue: this.adminDashboardService.getDailyRevenue(),
    }).subscribe({
      next: ({ waiters, todayGuests, tables, dailyRevenue }) => {
        this.loading = false;
        this.todayGuests = todayGuests;
        this.totalTables = tables.length;
        this.activeWaiters = waiters.filter(
          (w) => w.role === 'waiter' && w.on_shift
        ).length;
        this.dailyRevenue = dailyRevenue;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Nem sikerült betölteni a statisztikákat.';
        console.error('STATS LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }
}
