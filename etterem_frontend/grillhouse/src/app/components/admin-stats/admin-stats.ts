import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, interval, Subscription } from 'rxjs';
import { AdminDashboardService } from '../../services/admin-dashboard.service';
import type { GuestHistoryPoint } from '../../models/guest-history-point.model';
import { AdminTablesService } from '../../services/admin-tables.service';
import type { ChartDataPoint } from '../../models/admin-stats-chart-data-point.model';
import type { ChartGridLine } from '../../models/admin-stats-chart-grid-line.model';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.css',
})
export class AdminStatsComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';

  dailyRevenue = 0;
  todayGuests = 0;
  activeWaiters = 0;
  totalTables = 0;
  guestHistory: GuestHistoryPoint[] = [];

  private readonly CHART_LEFT   = 45;
  private readonly CHART_TOP    = 15;
  private readonly CHART_BOTTOM = 165;
  private readonly CHART_WIDTH  = 540;
  private readonly CHART_HEIGHT = 150;

  private hasLoadedOnce = false;
  private isRequestInFlight = false;
  private pollSubscription: Subscription | null = null;

  constructor(
    private adminDashboardService: AdminDashboardService,
    private adminTablesService: AdminTablesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();

    this.pollSubscription = interval(10000).subscribe(() => {
      if (this.isRequestInFlight) {
        return;
      }

      this.adminTablesService.invalidateTablesCache();
      this.adminDashboardService.invalidateWaitersCache();
      this.adminDashboardService.invalidateStatsCache();
      this.loadStats(true);
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = null;
  }

  loadStats(silent = false): void {
    if (this.isRequestInFlight) {
      return;
    }

    this.isRequestInFlight = true;

    if (!silent || !this.hasLoadedOnce) {
      this.loading = true;
    }

    if (!silent) {
      this.error = '';
    }

    forkJoin({
      waiters:      this.adminDashboardService.getWaiters(),
      todayGuests:  this.adminDashboardService.getTodayGuestCount(),
      tables:       this.adminTablesService.getTables(),
      dailyRevenue: this.adminDashboardService.getDailyRevenue(),
      guestHistory: this.adminDashboardService.getGuestCountHistory(),
    }).subscribe({
      next: ({ waiters, todayGuests, tables, dailyRevenue, guestHistory }) => {
        this.isRequestInFlight = false;
        this.loading = false;
        this.hasLoadedOnce = true;
        this.todayGuests    = todayGuests;
        this.totalTables    = tables.length;
        this.activeWaiters  = waiters.filter(
          (w) => w.role === 'waiter' && w.on_shift
        ).length;
        this.dailyRevenue   = dailyRevenue;
        this.guestHistory   = guestHistory;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isRequestInFlight = false;
        this.loading = false;
        if (!silent || !this.hasLoadedOnce) {
          this.error = 'Nem sikerült betölteni a statisztikákat.';
        }
        console.error('STATS LOAD ERROR:', err);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Chart helpers ──────────────────────────────────────────────

  private get chartMaxValue(): number {
    return Math.max(...this.guestHistory.map(p => p.guest_count), 1);
  }

  private chartGetX(i: number): number {
    if (this.guestHistory.length <= 1) return this.CHART_LEFT + this.CHART_WIDTH / 2;
    return this.CHART_LEFT + (i / (this.guestHistory.length - 1)) * this.CHART_WIDTH;
  }

  private chartGetY(value: number): number {
    return this.CHART_BOTTOM - (value / this.chartMaxValue) * this.CHART_HEIGHT;
  }

  get chartLinePoints(): string {
    if (!this.guestHistory.length) return '';
    return this.guestHistory
      .map((p, i) => `${this.chartGetX(i).toFixed(1)},${this.chartGetY(p.guest_count).toFixed(1)}`)
      .join(' ');
  }

  get chartAreaPoints(): string {
    if (!this.guestHistory.length) return '';
    const pts = this.guestHistory.map((p, i) =>
      `${this.chartGetX(i).toFixed(1)},${this.chartGetY(p.guest_count).toFixed(1)}`
    );
    const lastX = this.chartGetX(this.guestHistory.length - 1).toFixed(1);
    const firstX = this.chartGetX(0).toFixed(1);
    return [...pts, `${lastX},${this.CHART_BOTTOM}`, `${firstX},${this.CHART_BOTTOM}`].join(' ');
  }

  get chartDataPoints(): ChartDataPoint[] {
    return this.guestHistory.map((p, i) => {
      const parts    = p.date.split('-');
      const dayLabel = `${parts[1]}.${parts[2]}`;
      return {
        x:          parseFloat(this.chartGetX(i).toFixed(1)),
        y:          parseFloat(this.chartGetY(p.guest_count).toFixed(1)),
        date:       p.date,
        dayLabel,
        guestCount: p.guest_count,
        tooltip:    `${dayLabel}: ${p.guest_count} vendég`,
      };
    });
  }

  get chartGridLines(): ChartGridLine[] {
    const max  = this.chartMaxValue;
    const step = Math.max(1, Math.ceil(max / 4));
    const lines: ChartGridLine[] = [];
    for (let v = 0; v <= max; v += step) {
      const y = parseFloat((this.CHART_BOTTOM - (v / max) * this.CHART_HEIGHT).toFixed(1));
      lines.push({ y, label: `${v}` });
    }
    return lines.reverse();
  }
}
