import { Routes } from '@angular/router';
import { EmployeeIndexComponent } from './employees/employee-index.component';

export const routes: Routes = [
  {
    path: '',
    component: EmployeeIndexComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
