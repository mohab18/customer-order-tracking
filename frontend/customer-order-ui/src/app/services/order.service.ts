import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Order, OrderFilter, PagedResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  getCustomerOrders(customerId: string, filter: OrderFilter): Observable<PagedResult<Order>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber.toString())
      .set('pageSize', filter.pageSize.toString());

    if (filter.startDate) {
      params = params.set('startDate', filter.startDate);
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate);
    }
    if (filter.minAmount !== undefined) {
      params = params.set('minAmount', filter.minAmount.toString());
    }
    if (filter.maxAmount !== undefined) {
      params = params.set('maxAmount', filter.maxAmount.toString());
    }

    return this.http.get<PagedResult<Order>>(`${this.apiUrl}/customer/${customerId}`, { params });
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
