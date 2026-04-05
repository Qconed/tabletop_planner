import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Reservation, StatutWorkflow } from '../../../../core/models/reservation.model';
import { ReservationService } from '../../../../core/services/reservation.service';
import { FestivalWorkspaceStore } from '../../../../core/store/festival-workspace.store';
import { AuthService } from '../../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { ReservationDetailComponent } from './reservation-detail/reservation-detail.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ReservationDetailComponent
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly statuts: readonly StatutWorkflow[] = [
    'PAS_DE_CONTACT',
    'CONTACT_PRIS',
    'DISCUSSION_EN_COURS',
    'SERA_ABSENT',
    'CONSIDERE_ABSENT',
    'PRESENT',
    'FACTURE',
    'FACTURE_PAYEE',
  ];

  readonly reservations = signal<Reservation[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly router: Router,
    private readonly reservationService: ReservationService,
    private readonly workspaceStore: FestivalWorkspaceStore,
    private readonly dialog: MatDialog,
    public readonly authService: AuthService
  ) {
    effect(() => {
      const festivalId = this.workspaceStore.festivalId();
      if (festivalId) {
        this.loadReservations(festivalId);
      }
    });
  }

  openCreateReservationDialog(): void {
    const dialogRef = this.dialog.open(ReservationFormComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false
    });

    dialogRef.componentInstance.formSubmitted.subscribe(() => {
      const festivalId = this.workspaceStore.festivalId();
      if (festivalId) {
        this.loadReservations(festivalId);
      }
      dialogRef.close();
    });

    dialogRef.componentInstance.formCancelled.subscribe(() => {
      dialogRef.close();
    });
  }

  openReservationDetail(reservationId: number): void {
    const dialogRef = this.dialog.open(ReservationDetailComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { reservationId },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((shouldRefresh) => {
      if (shouldRefresh) {
        const festivalId = this.workspaceStore.festivalId();
        if (festivalId) {
          this.loadReservations(festivalId);
        }
      }
    });
  }

  formatStatut(statut: StatutWorkflow): string {
    return statut.replaceAll('_', ' ');
  }

  private loadReservations(festivalId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getAll({ idFestival: festivalId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reservations) => {
          this.reservations.set(reservations);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Impossible de charger les réservations de ce festival.');
          this.isLoading.set(false);
        },
      });
  }
}

