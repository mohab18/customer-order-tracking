


import {
  Component,
  OnDestroy,
  OnInit,
  Inject,
  PLATFORM_ID,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Customer, CreateCustomer, UpdateCustomer } from '../../models/models';
import { CustomerService } from '../../services/customer.service';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css'],
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];

  // CREATE FORM
  createForm!: FormGroup;
  createLoading = false;
  createMsg = '';
  createMsgType: 'success' | 'error' = 'success';

  // UPDATE FORM
  updateForm!: FormGroup;
  updateLoading = false;
  updateMsg = '';
  updateMsgType: 'success' | 'error' = 'success';
  updateFieldsVisible = false;
  selectedCustomerId: string | null = null;

  // DELETE MODAL
  showDeleteModal = false;
  deleteLoading = false;
  customerToDelete: Customer | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private customersApi: CustomerService,
    private signalr: SignalrService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initializeCreateForm();
    this.initializeUpdateForm();
    this.load();

    await this.signalr.startConnection();

    this.signalr.customerUpdated$
      .pipe(
        takeUntil(this.destroy$),
        filter((id): id is string => !!id)
      )
      .subscribe((customerId) => {
        console.log('CustomerUpdated ✅', customerId);
        this.zone.run(() => this.load());
      });

    
    this.signalr.newOrder$
      .pipe(
        takeUntil(this.destroy$),
        filter((o): o is any => !!o)
      )
      .subscribe((order) => {
        console.log('ReceiveOrder ✅', order);
        
      });
  }

  initializeCreateForm() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      isActive: [true, Validators.required]
    });
  }


  initializeUpdateForm() {
    this.updateForm = this.fb.group({
      customerId: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      isActive: [true, Validators.required]
    });
    // Disable update fields by default
    this.updateForm.get('name')?.disable();
    this.updateForm.get('email')?.disable();
    this.updateForm.get('isActive')?.disable();
  }

  load() {
    this.customersApi.getAll().subscribe((res) => {
      this.customers = [...res];
      this.cdr.detectChanges();
    });
  }

  
  onCreateSubmit() {
  
    if (this.createForm.invalid) {
      this.createMsgType = 'error';
      this.createMsg = 'Please enter a valid name and email.';
      return;
    }

   
    this.createLoading = true;
    this.createMsg = '';

    
    const customer = this.createForm.getRawValue() as CreateCustomer;

    
    this.customersApi
      .create(customer)
      .subscribe({
        next: () => {
          this.createMsgType = 'success';
          this.createMsg = 'Customer created successfully!';
          this.createForm.reset({ name: '', email: '', isActive: true });
          this.load();
          this.createLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.createMsgType = 'error';
          this.createMsg = 'Failed to create customer';
          this.createLoading = false;
        },
      });
  }


  
  onCreateReset() {
    this.createForm.reset();
    this.createMsg = '';
  }

  
  onCustomerSelect() {
    const customerId = this.updateForm.get('customerId')?.value as string | null;

    
    if (!customerId) {
      this.selectedCustomerId = null;
      this.updateFieldsVisible = false;
      this.updateMsg = '';


      this.updateForm.patchValue({ name: '', email: '', isActive: true });
      this.updateForm.get('name')?.disable();
      this.updateForm.get('email')?.disable();
      this.updateForm.get('isActive')?.disable();
      return;
    }

    const customer = this.customers.find((c) => c.id === customerId);

    if (!customer) {
      console.error('[onCustomerSelect] Customer not found:', customerId);
      this.selectedCustomerId = null;
      this.updateFieldsVisible = false;
      this.updateMsg = 'Customer not found. Please reload the page.';
      this.updateMsgType = 'error';
      return;
    }

    this.selectedCustomerId = customer.id;

    
    this.updateForm.patchValue({
      name: customer.name,
      email: customer.email,
      isActive: customer.isActive,
    });

   
    this.updateForm.get('name')?.enable();
    this.updateForm.get('email')?.enable();
    this.updateForm.get('isActive')?.enable();

    this.updateFieldsVisible = true;

    this.updateMsg = '';

  }


  
  onUpdateSubmit() {
    
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.updateMsg = 'Please fix the highlighted fields.';
      this.updateMsgType = 'error';
      return;
    }

    
    if (!this.selectedCustomerId) {
      this.updateMsg = 'Please select a customer to update.';
      this.updateMsgType = 'error';
      return;
    }

    
    this.updateLoading = true;
    this.updateMsg = '';


    const { name, email, isActive } = this.updateForm.getRawValue();
    const payload: UpdateCustomer = {
      name,
      email,
      isActive: !!isActive,
    };

    
    this.customersApi.update(this.selectedCustomerId, payload).subscribe({
      next: () => {
        this.updateMsg = 'Customer updated successfully!';
        this.updateMsgType = 'success';
        this.updateLoading = false;

        this.load();

        
      },
      error: (err) => {
        console.error('[onUpdateSubmit] Failed to update customer:', err);
        this.updateMsg = 'Failed to update customer';
        this.updateMsgType = 'error';
        this.updateLoading = false;
      },
    });
  }
  
  onUpdateReset() {
    this.updateForm.reset();
    this.updateFieldsVisible = false;
    this.selectedCustomerId = null;
    this.updateMsg = '';
    
    this.updateForm.get('name')?.disable();
    this.updateForm.get('email')?.disable();
    this.updateForm.get('isActive')?.disable();
  }

  
  openDeleteModal(customer: Customer) {
    this.customerToDelete = customer;
    this.showDeleteModal = true;

  
  }

 

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.customerToDelete = null;
  }

  
   

  confirmDelete() {
    
    if (!this.customerToDelete) return;

    
    this.deleteLoading = true;

   
    this.customersApi.delete(this.customerToDelete.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.load();
        this.deleteLoading = false;
      },
      error: (err) => {
        console.error('[confirmDelete] Failed to delete customer:', err);
        alert('Failed to delete customer');
        this.deleteLoading = false;
      },
    });
  }
 


  openOrders(id: string) {
    this.router.navigate(['/customers', id, 'orders']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalr.stopConnection(); 
  }
}
