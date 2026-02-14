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
    
    this.customerId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.customerId) {
      console.error('No customer ID provided');
      return;
    }

    this.filtersForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      minAmount: [null],
      maxAmount: [null],
    });

    
    try {
      await this.signalr.startConnection();
    } catch (err) {
      console.error('Failed to start SignalR connection:', err);
    }

 
    try {
      await this.signalr.joinCustomerGroup(this.customerId);
    } catch (err) {
      console.error('Failed to join customer group:', err);
    }

    
    this.orderUpdateSub = this.signalr.newOrder$.subscribe((order) => {
      if (!this.autoUpdate) return;
      if (this.isLoading) return;
      if (!order) return;
      if (order.customerId !== this.customerId) return;

      console.log('New order received, reloading...');
      this.load();
    });

    
    this.load();
  }

 
  
  private toIso(d: Date | null | undefined): string | undefined {
    return d ? d.toISOString() : undefined;
  }

 
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

  
  applyFilters() {
    this.page = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.load();
  }

  
  clearFilters() {
    this.filtersForm.reset({
      fromDate: null,
      toDate: null,
      minAmount: null,
      maxAmount: null,
    });
    this.applyFilters();
  }


  
  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.load();
  }

  
  toggleAutoUpdate(checked: boolean) {
    this.autoUpdate = checked;
    console.log('Auto-update toggled:', checked);
  }

  ngOnDestroy() {
   
    this.orderUpdateSub?.unsubscribe();

   
    this.signalr.leaveCustomerGroup(this.customerId).catch((err) => {
      console.error('Failed to leave customer group:', err);
    });
  }
}
