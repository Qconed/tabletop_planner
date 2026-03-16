import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { FestivalManagerComponent } from './features/festival/festival-manager.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'festivals',
    component: FestivalManagerComponent
  }
];
