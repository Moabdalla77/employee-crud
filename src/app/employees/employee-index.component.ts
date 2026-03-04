import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { AddEmployeeComponent } from './add-employee.component';
import { EditEmployeeComponent } from './edit-employee.component';
import { EmployeeApiService } from './employee-api.service';
import { Employee } from './employee.model';

@Component({
  selector: 'app-employee-index',
  imports: [CommonModule, AddEmployeeComponent, EditEmployeeComponent],
  templateUrl: './employee-index.component.html',
  styleUrl: './employee-index.component.css'
})
export class EmployeeIndexComponent implements OnInit {
  readonly pageSize = 10;
  currentPage = signal(1);
  totalCount = signal(0);
  employees = signal<Employee[]>([]);
  selectedRows = new Set<number>();

  sortBy = signal<'id' | 'name' | 'address'>('id');
  sortDirection = signal<'asc' | 'desc'>('desc');

  isLoading = signal(false);
  errorMessage = signal('');

  isAddDialogOpen = signal(false);
  isEditDialogOpen = signal(false);
  employeeToEdit = signal<Employee | null>(null);

  isDeleteDialogOpen = signal(false);
  employeeToDelete = signal<Employee | null>(null);
  isDeleting = signal(false);

  constructor(private readonly employeeApiService: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.employeeApiService
      .getEmployees({
        pageNumber: this.currentPage(),
        pageSize: this.pageSize,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection()
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ items, totalCount }) => {
          this.employees.set(items);
          this.totalCount.set(totalCount);
          this.selectedRows.clear();
        },
        error: () => {
          this.employees.set([]);
          this.totalCount.set(0);
          this.errorMessage.set('Unable to load employees from API.');
        }
      });
  }

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const maxVisible = 7;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, this.currentPage() - half);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  showLeadingEllipsis = computed(() => this.visiblePages()[0] > 2);

  showTrailingEllipsis = computed(
    () => this.visiblePages()[this.visiblePages().length - 1] < this.totalPages() - 1
  );

  allRowsSelected = computed(
    () => this.employees().length > 0 && this.selectedRows.size === this.employees().length
  );

  setPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage() ||
      this.isLoading()
    ) {
      return;
    }

    this.currentPage.set(page);
    this.loadEmployees();
  }

  toggleSort(column: 'name' | 'address'): void {
    if (this.sortBy() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDirection.set('asc');
    }

    this.currentPage.set(1);
    this.loadEmployees();
  }

  toggleAllRows(checked: boolean): void {
    this.selectedRows.clear();
    if (checked) {
      for (const employee of this.employees()) {
        this.selectedRows.add(employee.id);
      }
    }
  }

  toggleRow(employeeId: number, checked: boolean): void {
    if (checked) {
      this.selectedRows.add(employeeId);
    } else {
      this.selectedRows.delete(employeeId);
    }
  }

  openAddDialog(): void {
    this.isAddDialogOpen.set(true);
  }

  closeAddDialog(): void {
    this.isAddDialogOpen.set(false);
  }

  openEditDialog(employee: Employee): void {
    this.employeeToEdit.set(employee);
    this.isEditDialogOpen.set(true);
  }

  closeEditDialog(): void {
    this.employeeToEdit.set(null);
    this.isEditDialogOpen.set(false);
  }

  onEmployeeSaved(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  openDeleteDialog(employee: Employee): void {
    this.employeeToDelete.set(employee);
    this.isDeleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    if (this.isDeleting()) {
      return;
    }

    this.employeeToDelete.set(null);
    this.isDeleteDialogOpen.set(false);
  }

  confirmDelete(): void {
    if (!this.employeeToDelete() || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.employeeApiService
      .deleteEmployee(this.employeeToDelete()!.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.loadEmployees();
        }
      });
  }
}
