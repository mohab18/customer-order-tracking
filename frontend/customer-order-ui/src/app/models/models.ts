export interface Customer {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  totalOrders: number;
  latestOrderTime?: Date;
}

export interface CreateCustomer {
  name: string;
  email: string;
  isActive: boolean;
}

export interface UpdateCustomer {
  name: string;
  email: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
  customerId: string;
  customerName: string;
}

export interface OrderFilter {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  pageNumber: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
