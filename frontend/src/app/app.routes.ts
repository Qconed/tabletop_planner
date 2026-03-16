import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { FestivalManagerComponent } from './features/festival/festival-manager/festival-manager.component';
import { ReservationsComponent } from './features/festival/festival-workspace/reservations/reservations.component';
import { FestivalWorkspaceShellComponent } from './features/festival/festival-workspace/festival-workspace-shell.component';
import { FestivalWorkspaceRootComponent } from './features/festival/festival-workspace/festival-workspace-root/festival-workspace-root.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'festivals',
    component: FestivalManagerComponent
  },
  {
    path: 'festivals/:id',
    component: FestivalWorkspaceShellComponent,
    children: [
      { path: '', component: FestivalWorkspaceRootComponent },
      { path: 'reservations', component: ReservationsComponent }
    ]
  }
];
