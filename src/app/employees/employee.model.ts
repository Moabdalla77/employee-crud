export interface Employee {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
}

export interface EmployeeFormValue {
  name: string;
  email: string;
  mobile: string;
  address: string;
}

export interface EmployeeQuery {
  pageNumber: number;
  pageSize: number;
  sortBy?: 'id' | 'name' | 'address';
  sortDirection?: 'asc' | 'desc';
}

export interface PagedEmployees {
  items: Employee[];
  totalCount: number;
}
