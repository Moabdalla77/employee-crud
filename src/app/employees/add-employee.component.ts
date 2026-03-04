import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmployeeApiService } from './employee-api.service';
import { EmployeeFormValue } from './employee.model';

@Component({
  selector: 'app-add-employee',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-employee.component.html',
  styleUrl: './employee-modal.component.css'
})
export class AddEmployeeComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Input() open = false;
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
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue() as EmployeeFormValue;

    this.employeeApiService
      .addEmployee(payload)
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
