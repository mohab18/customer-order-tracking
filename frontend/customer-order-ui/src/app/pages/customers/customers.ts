


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

    // ✅ start SignalR using YOUR method name
    await this.signalr.startConnection();

    // ✅ listen to "CustomerUpdated" event (YOUR observable)
    this.signalr.customerUpdated$
      .pipe(
        takeUntil(this.destroy$),
        filter((id): id is string => !!id)
      )
      .subscribe((customerId) => {
        console.log('CustomerUpdated ✅', customerId);
        this.zone.run(() => this.load());
      });

    // (Optional) if you also want to react to any new order:
    this.signalr.newOrder$
      .pipe(
        takeUntil(this.destroy$),
        filter((o): o is any => !!o)
      )
      .subscribe((order) => {
        console.log('ReceiveOrder ✅', order);
        // you can reload too, but CustomerUpdated already covers it
      });
  }

  /**
   * INITIALIZE CREATE FORM
   * Creates a FormGroup with validators for name, email, and isActive status
   */
  initializeCreateForm() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      isActive: [true, Validators.required]
    });
  }

  /**
   * INITIALIZE UPDATE FORM
   * Creates a FormGroup for updating an existing customer
   */
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

  /**
   * LOAD ALL CUSTOMERS
   * Fetches all customers from the CustomerService and updates the customers array
   */
  load() {
    this.customersApi.getAll().subscribe((res) => {
      this.customers = [...res];
      this.cdr.detectChanges();
    });
  }

  /**
   * CREATE CUSTOMER SUBMIT HANDLER
   * Validates form, calls CustomerService.create(), handles response and errors
   * TODO: 
   *   1. Check if createForm is valid
   *   2. Set createLoading to true for loading state
   *   3. Extract form values as CreateCustomer object
   *   4. Call this.customersApi.create(customer) with subscribe:
   *      - On success: 
   *        - Show success message "Customer created successfully!"
   *        - Set createMsgType to 'success'
   *        - Reset form using this.createForm.reset()
   *        - Call this.load() to refresh customer list
   *        - Set createLoading to false
   *      - On error: 
   *        - Show error message "Failed to create customer"
   *        - Set createMsgType to 'error'
   *        - Set createLoading to false
   *        - Log error to console
   */
  onCreateSubmit() {
    // 1) validate
    if (this.createForm.invalid) {
      this.createMsgType = 'error';
      this.createMsg = 'Please enter a valid name and email.';
      return;
    }

    // 2) loading on
    this.createLoading = true;
    this.createMsg = '';

    // 3) payload
    const customer = this.createForm.getRawValue() as CreateCustomer;

    // 4) call service
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


  /**
   * RESET CREATE FORM
   * Clears all form fields and resets validation states
   */
  onCreateReset() {
    this.createForm.reset();
    this.createMsg = '';
  }

  /**
   * CUSTOMER SELECTED FROM DROPDOWN
   * When a customer is selected from the update dropdown:
   * TODO:
   *   1. Get the selected customer ID from this.updateForm.get('customerId')?.value
   *   2. Find the customer in this.customers array
   *   3. If customer found:
   *      - Set this.selectedCustomerId to the customer ID
   *      - Populate updateForm with customer data:
   *        - name: customer.name
   *        - email: customer.email
   *        - isActive: customer.isActive
   *      - Enable the form fields (name, email, isActive)
   *      - Set this.updateFieldsVisible to true
   *      - Clear any previous messages
   *   4. If customer not found:
   *      - Log error and show message
   */
  onCustomerSelect() {
    const customerId = this.updateForm.get('customerId')?.value as string | null;

    // reset state if nothing selected
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

    // populate form
    this.updateForm.patchValue({
      name: customer.name,
      email: customer.email,
      isActive: customer.isActive,
    });

    // enable fields
    this.updateForm.get('name')?.enable();
    this.updateForm.get('email')?.enable();
    this.updateForm.get('isActive')?.enable();

    this.updateFieldsVisible = true;

    // clear previous messages
    this.updateMsg = '';

  }


  /**
   * UPDATE CUSTOMER SUBMIT HANDLER
   * Validates form, calls CustomerService.update(), handles response and errors
   * TODO:
   *   1. Check if updateForm is valid
   *   2. Check if selectedCustomerId is set
   *   3. Set updateLoading to true
   *   4. Extract form values (name, email, isActive) as UpdateCustomer object
   *   5. Call this.customersApi.update(selectedCustomerId, customer) with subscribe:
   *      - On success:
   *        - Show success message "Customer updated successfully!"
   *        - Set updateMsgType to 'success'
   *        - Call this.load() to refresh customer list
   *        - Set updateLoading to false
   *      - On error:
   *        - Show error message "Failed to update customer"
   *        - Set updateMsgType to 'error'
   *        - Set updateLoading to false
   *        - Log error to console
   */
  onUpdateSubmit() {
    // 1) validate form
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      this.updateMsg = 'Please fix the highlighted fields.';
      this.updateMsgType = 'error';
      return;
    }

    // 2) ensure selected id
    if (!this.selectedCustomerId) {
      this.updateMsg = 'Please select a customer to update.';
      this.updateMsgType = 'error';
      return;
    }

    // 3) loading
    this.updateLoading = true;
    this.updateMsg = '';


    // 4) extract values
    const { name, email, isActive } = this.updateForm.getRawValue();
    const payload: UpdateCustomer = {
      name,
      email,
      isActive: !!isActive,
    };

    // 5) call service
    this.customersApi.update(this.selectedCustomerId, payload).subscribe({
      next: () => {
        this.updateMsg = 'Customer updated successfully!';
        this.updateMsgType = 'success';
        this.updateLoading = false;

        // refresh list + cards
        this.load();

        // optional: keep selection visible (if your load() rebuilds customers list)
        // this.updateForm.get('customerId')?.setValue(this.selectedCustomerId);
      },
      error: (err) => {
        console.error('[onUpdateSubmit] Failed to update customer:', err);
        this.updateMsg = 'Failed to update customer';
        this.updateMsgType = 'error';
        this.updateLoading = false;
      },
    });
  }
  /**
   * RESET UPDATE FORM
   * Clears the update form and hides the fields
   */
  onUpdateReset() {
    this.updateForm.reset();
    this.updateFieldsVisible = false;
    this.selectedCustomerId = null;
    this.updateMsg = '';
    // Disable fields again
    this.updateForm.get('name')?.disable();
    this.updateForm.get('email')?.disable();
    this.updateForm.get('isActive')?.disable();
  }

  /**
   * OPEN DELETE MODAL
   * Opens the delete confirmation modal for a customer
   * TODO:
   *   1. Set this.customerToDelete to the customer object
   *   2. Set this.showDeleteModal to true
   */
  openDeleteModal(customer: Customer) {
    this.customerToDelete = customer;
    this.showDeleteModal = true;

    // clear any previous delete messages if you have them
    // this.deleteMsg = '';
    // this.deleteMsgType = '';
  }

 

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.customerToDelete = null;
  }

  /**
   * CONFIRM DELETE CUSTOMER
   * Submits the delete request to the API
   * TODO:
   *   1. Check if customerToDelete is set
   *   2. Set deleteLoading to true
   *   3. Call this.customersApi.delete(customerToDelete.id) with subscribe:
   *      - On success:
   *        - Show success message "Customer deleted successfully!"
   *        - Close the modal (closeDeleteModal())
   *        - Call this.load() to refresh customer list
   *        - Set deleteLoading to false
   *      - On error:
   *        - Log error to console
   *        - Alert user: "Failed to delete customer"
   *        - Set deleteLoading to false
   */

  confirmDelete() {
    // 1) ensure we have a customer
    if (!this.customerToDelete) return;

    // 2) loading
    this.deleteLoading = true;

    // 3) call API
    this.customersApi.delete(this.customerToDelete.id).subscribe({
      next: () => {
        // success message


        // close modal + refresh
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
 

  /**
   * OPEN CUSTOMER ORDERS
   * Navigates to the orders page for a specific customer
   */
  openOrders(id: string) {
    this.router.navigate(['/customers', id, 'orders']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalr.stopConnection(); // ✅ YOUR new method
  }
}
