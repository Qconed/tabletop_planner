import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Reservation, StatutWorkflow } from '../../../../../core/models/reservation.model';
import { ReservationService } from '../../../../../core/services/reservation.service';
import { FestivalWorkspaceStore } from '../../../../../core/store/festival-workspace.store';

@Component({
  selector: 'app-reservation-detail',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.css'
})
export class ReservationDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly reservation = signal<Reservation | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

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

  readonly form = this.fb.nonNullable.group({
    nbTablesResa: [1, [Validators.required, Validators.min(1)]],
    statut: ['PAS_DE_CONTACT' as StatutWorkflow, Validators.required],
    notesResa: [''],
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly reservationService: ReservationService,
    private readonly workspaceStore: FestivalWorkspaceStore
  ) {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const reservationId = Number(params.get('reservationId'));
      if (!Number.isFinite(reservationId) || reservationId <= 0) {
        this.errorMessage.set('Identifiant de réservation invalide.');
        this.isLoading.set(false);
        return;
      }

      this.loadReservation(reservationId);
    });
  }

  save(): void {
    const reservation = this.reservation();
    if (!reservation) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Le formulaire contient des erreurs.');
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.reservationService.update(reservation.id, {
      nbTablesResa: formValue.nbTablesResa,
      statut: formValue.statut,
      notesResa: formValue.notesResa.trim() || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedReservation) => {
        this.reservation.set(updatedReservation);
        this.successMessage.set('Réservation mise à jour.');
        this.isSaving.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error ?? 'Impossible de mettre à jour la réservation.');
        this.isSaving.set(false);
      },
    });
  }

  deleteReservation(): void {
    const reservation = this.reservation();
    const festivalId = this.workspaceStore.festivalId();

    if (!reservation || !festivalId) {
      return;
    }

    const confirmed = window.confirm('Supprimer cette réservation ? Cette action est irréversible.');
    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.reservationService.delete(reservation.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/festivals', festivalId, 'reservations']);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error ?? 'Impossible de supprimer la réservation.');
        this.isSaving.set(false);
      },
    });
  }

  backToList(): void {
    const festivalId = this.workspaceStore.festivalId();
    if (!festivalId) {
      this.router.navigate(['/festivals']);
      return;
    }

    this.router.navigate(['/festivals', festivalId, 'reservations']);
  }

  formatStatut(statut: StatutWorkflow): string {
    return statut.replaceAll('_', ' ');
  }

  private loadReservation(reservationId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getById(reservationId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.form.setValue({
          nbTablesResa: reservation.nbTablesResa,
          statut: reservation.statut,
          notesResa: reservation.notesResa ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Réservation introuvable.');
        this.isLoading.set(false);
      },
    });
  }
}
