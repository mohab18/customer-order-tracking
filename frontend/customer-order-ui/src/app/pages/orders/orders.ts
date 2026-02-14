import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

import { Order, OrderFilter, PagedResult } from '../../models/models';
import { OrderService } from '../../services/order.service';
import { SignalrService } from '../../services/signalr.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './orders.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./orders.css'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  customerId!: string;

  displayedColumns: string[] = ['createdAt', 'description', 'amount'];
  data: Order[] = [];

  total = 0;
  page = 1;
  pageSize = 10;

  autoUpdate = true;
  isLoading = false;

  filtersForm!: ReturnType<FormBuilder['group']>;
  private sub?: Subscription;
  private orderUpdateSub?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private ordersApi: OrderService,
    private signalr: SignalrService,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    // Get customer ID from route
    this.customerId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.customerId) {
      console.error('No customer ID provided');
      return;
    }

    // Initialize filters form with controls enabled consistently
    this.filtersForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      minAmount: [null],
      maxAmount: [null],
    });

    // ✅ start SignalR connection
    try {
      await this.signalr.startConnection();
    } catch (err) {
      console.error('Failed to start SignalR connection:', err);
    }

    // ✅ join customer group for real-time updates
    try {
      await this.signalr.joinCustomerGroup(this.customerId);
    } catch (err) {
      console.error('Failed to join customer group:', err);
    }

    // ✅ listen for new orders and reload if auto-update is enabled
    this.orderUpdateSub = this.signalr.newOrder$.subscribe((order) => {
      if (!this.autoUpdate) return;
      if (this.isLoading) return;
      if (!order) return;
      if (order.customerId !== this.customerId) return;

      console.log('New order received, reloading...');
      this.load();
    });

    // ✅ LOAD ORDERS IMMEDIATELY ON PAGE INIT
    this.load();
  }

  /**
   * Convert Date to ISO string for API
   */
  private toIso(d: Date | null | undefined): string | undefined {
    return d ? d.toISOString() : undefined;
  }

  /**
   * Build filter object from form values
   */
  private buildFilter(): OrderFilter {
    const v = this.filtersForm.getRawValue();

    return {
      pageNumber: this.page,
      pageSize: this.pageSize,
      startDate: this.toIso(v.fromDate),
      endDate: this.toIso(v.toDate),
      minAmount: v.minAmount ?? undefined,
      maxAmount: v.maxAmount ?? undefined,
    };
  }

  /**
   * LOAD ORDERS
   * Fetches orders from the API with current filters and pagination
   * This method is called on:
   * - Page initialization
   * - Filter changes
   * - Pagination changes
   * - Manual refresh
   * - New orders received (if auto-update is enabled)
   */
  load() {
    this.isLoading = true;
    this.cdr.markForCheck();
    const filter = this.buildFilter();

    console.log('Loading orders for customer:', this.customerId, 'Filter:', filter);

    this.ordersApi
      .getCustomerOrders(this.customerId, filter)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: PagedResult<Order>) => {
          console.log('Orders loaded successfully:', res);
          this.data = res.items ?? [];
          this.total = res.totalCount ?? 0;
          // Note: API might return current page, adjust if needed
          if (res.pageNumber) {
            this.page = res.pageNumber;
          }
          if (res.pageSize) {
            this.pageSize = res.pageSize;
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to load orders:', err);
          this.data = [];
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * APPLY FILTERS
   * Resets to page 1 and reloads orders with new filter values
   */
  applyFilters() {
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.load();
  }

  /**
   * CLEAR ALL FILTERS
   * Resets filter form and reloads all orders
   */
  clearFilters() {
    this.filtersForm.reset({
      fromDate: null,
      toDate: null,
      minAmount: null,
      maxAmount: null,
    });
    this.applyFilters();
  }


  /**
   * HANDLE PAGINATION
   * Called when user changes page or page size
   */
  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.load();
  }

  /**
   * TOGGLE AUTO-UPDATE
   * Enable/disable automatic reloading when new orders arrive via SignalR
   */
  toggleAutoUpdate(checked: boolean) {
    this.autoUpdate = checked;
    console.log('Auto-update toggled:', checked);
  }

  ngOnDestroy() {
    // Unsubscribe from SignalR order updates
    this.orderUpdateSub?.unsubscribe();

    // Leave customer group
    this.signalr.leaveCustomerGroup(this.customerId).catch((err) => {
      console.error('Failed to leave customer group:', err);
    });
  }
}
