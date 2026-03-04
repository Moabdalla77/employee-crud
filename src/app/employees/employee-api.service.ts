import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Employee, EmployeeFormValue, EmployeeQuery, PagedEmployees } from './employee.model';

interface ApiEmployee {
  empId: number;
  empName: string;
  empEmail: string;
  empPhone: string;
  empAddress: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  constructor(private readonly http: HttpClient) {}

  getEmployees(query: EmployeeQuery): Observable<PagedEmployees> {
    return this.http
      .get<unknown>('/api/Employees/getAllEmployees')
      .pipe(map((response) => this.mapListResponse(response, query)));
  }

  addEmployee(payload: EmployeeFormValue): Observable<void> {
    const body = {
      empName: payload.name,
      empEmail: payload.email,
      empPhone: payload.mobile,
      empAddress: payload.address
    };

    return this.http
      .post('/api/Employees/addEmployee', body)
      .pipe(map(() => void 0));
  }

  updateEmployee(employeeId: number, payload: EmployeeFormValue): Observable<void> {
    const body = {
      empId: employeeId,
      empName: payload.name,
      empEmail: payload.email,
      empPhone: payload.mobile,
      empAddress: payload.address
    };

    return this.http
      .post('/api/Employees/editEmployee', body)
      .pipe(map(() => void 0));
  }

  deleteEmployee(employeeId: number): Observable<void> {
    return this.http
      .get(`/api/Employees/deleteEmpByID/${employeeId}`)
      .pipe(map(() => void 0));
  }

  private mapListResponse(response: unknown, query: EmployeeQuery): PagedEmployees {
    const rawList = this.extractArray(response).map((row, index) =>
      this.normalizeEmployee(row, index)
    );

    const sortBy = query.sortBy ?? 'id';
    const sortDirection = query.sortDirection ?? 'desc';
    const sorted = [...rawList].sort((a, b) => {
      if (sortBy === 'id') {
        const base = a.id - b.id;
        return sortDirection === 'asc' ? base : -base;
      }

      const left = (a[sortBy] ?? '').toString().toLowerCase();
      const right = (b[sortBy] ?? '').toString().toLowerCase();
      const base = left.localeCompare(right);
      return sortDirection === 'asc' ? base : -base;
    });

    const start = (query.pageNumber - 1) * query.pageSize;
    const end = start + query.pageSize;

    return {
      items: sorted.slice(start, end),
      totalCount: sorted.length
    };
  }

  private extractArray(response: unknown): ApiEmployee[] {
    if (Array.isArray(response)) {
      return response as ApiEmployee[];
    }

    if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj['data'])) {
        return obj['data'] as ApiEmployee[];
      }

      if (Array.isArray(obj['items'])) {
        return obj['items'] as ApiEmployee[];
      }
    }

    return [];
  }

  private normalizeEmployee(input: ApiEmployee, index: number): Employee {
    return {
      id: Number(input?.empId ?? index + 1),
      name: String(input?.empName ?? ''),
      email: String(input?.empEmail ?? ''),
      mobile: String(input?.empPhone ?? ''),
      address: String(input?.empAddress ?? '')
    };
  }
}
