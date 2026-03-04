import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmployeeApiService } from './employee-api.service';
import { Employee, EmployeeFormValue } from './employee.model';

@Component({
  selector: 'app-edit-employee',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-employee.component.html',
  styleUrl: './employee-modal.component.css'
})
export class EditEmployeeComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input() open = false;
  @Input() employee: Employee | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.pattern(/^(010|011|012|015)\d{8}$/)]],
    address: ['', Validators.required]
  });

  isSaving = false;

  constructor(private readonly employeeApiService: EmployeeApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['employee']) && this.open && this.employee) {
      this.form.patchValue({
        name: this.employee.name,
        email: this.employee.email,
        mobile: this.employee.mobile,
        address: this.employee.address
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  close(): void {
    if (this.isSaving) {
      return;
    }

    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.closed.emit();
  }

  save(): void {
    if (this.form.invalid || this.isSaving || !this.employee) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue() as EmployeeFormValue;

    this.employeeApiService
      .updateEmployee(this.employee.id, payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.saved.emit();
          this.close();
        }
      });
  }

  hasError(controlName: 'name' | 'email' | 'mobile' | 'address'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }
}
