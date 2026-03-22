import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { ClasseTarifaire } from '../../../../core/models/classe-tarifaire.model';
import { Editeur } from '../../../../core/models/editeur.model';
import { Reservation, StatutWorkflow } from '../../../../core/models/reservation.model';
import { ClasseTarifaireService } from '../../../../core/services/classe-tarifaire.service';
import { EditeurService } from '../../../../core/services/editeur.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { FestivalWorkspaceStore } from '../../../../core/store/festival-workspace.store';
import {
  AutocompleteSearchBarComponent,
  AutocompleteSearchOption
} from '../../../../shared/components/autocomplete-search-bar/autocomplete-search-bar.component';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, ReactiveFormsModule, AutocompleteSearchBarComponent],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

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
  readonly classesTarifaires = signal<ClasseTarifaire[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedEditeurTerm = signal<string | null>(null);
  readonly selectedEditeur = signal<Editeur | null>(null);

  readonly createForm = this.fb.nonNullable.group({
    nbTablesResa: [1, [Validators.required, Validators.min(1)]],
    notesResa: [''],
    statut: ['PAS_DE_CONTACT' as StatutWorkflow, Validators.required],
    reservationClasses: this.fb.array([]),
  });

  readonly editeurOptionsProvider = (search?: string) =>
    this.editeurService.searchByName(search).pipe(
      map((editeurs) =>
        editeurs.map(
          (editeur): AutocompleteSearchOption<number, Editeur> => ({
            label: editeur.libelle,
            value: editeur.id,
            meta: editeur
          })
        )
      )
    );

  get reservationClasses(): FormArray {
    return this.createForm.get('reservationClasses') as FormArray;
  }

  constructor(
    private readonly router: Router,
    private readonly editeurService: EditeurService,
    private readonly classeTarifaireService: ClasseTarifaireService,
    private readonly reservationService: ReservationService,
    private readonly workspaceStore: FestivalWorkspaceStore
  ) {
    effect(() => {
      const festivalId = this.workspaceStore.festivalId();
      if (festivalId) {
        this.loadReservationContext(festivalId);
      }
    });
  }

  addReservationClasse(): void {
    this.reservationClasses.push(
      this.fb.nonNullable.group({
        idClasseTarifaire: [0, [Validators.required, Validators.min(1)]],
        nbTables: [1, [Validators.required, Validators.min(1)]],
      })
    );
  }

  removeReservationClasse(index: number): void {
    this.reservationClasses.removeAt(index);
  }

  onEditeurTermSelected(term: string): void {
    this.selectedEditeurTerm.set(term);
  }

  onEditeurOptionSelected(option: AutocompleteSearchOption): void {
    const editeur = option.meta as Editeur | undefined;
    this.selectedEditeur.set(editeur ?? null);
  }

  createReservation(): void {
    const festivalId = this.workspaceStore.festivalId();
    const selectedEditeur = this.selectedEditeur();

    if (!festivalId || !selectedEditeur) {
      this.errorMessage.set('Veuillez sélectionner un festival et un éditeur.');
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.errorMessage.set('Le formulaire contient des erreurs.');
      return;
    }

    const formValue = this.createForm.getRawValue();
    const reservationClasses = this.reservationClasses.controls
      .map((control) => control.getRawValue() as { idClasseTarifaire: number; nbTables: number })
      .filter((value) => value.idClasseTarifaire > 0);

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.reservationService.create({
      idEditeur: selectedEditeur.id,
      idFestival: festivalId,
      nbTablesResa: formValue.nbTablesResa,
      notesResa: formValue.notesResa?.trim() || undefined,
      statut: formValue.statut,
      reservationClasses,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reservation) => {
        this.reservations.update((items) => [reservation, ...items]);
        this.successMessage.set('Réservation créée avec succès.');
        this.resetCreateForm();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error ?? 'Impossible de créer la réservation.');
        this.isSubmitting.set(false);
      },
    });
  }

  openReservationDetail(reservationId: number): void {
    const festivalId = this.workspaceStore.festivalId();
    if (!festivalId) {
      return;
    }

    this.router.navigate(['/festivals', festivalId, 'reservations', reservationId]);
  }

  formatStatut(statut: StatutWorkflow): string {
    return statut.replaceAll('_', ' ');
  }

  private loadReservationContext(festivalId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      classesTarifaires: this.classeTarifaireService.getByFestival(festivalId),
      reservations: this.reservationService.getAll({ idFestival: festivalId }),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ classesTarifaires, reservations }) => {
        this.classesTarifaires.set(classesTarifaires);
        this.reservations.set(reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les réservations de ce festival.');
        this.isLoading.set(false);
      },
    });
  }

  private resetCreateForm(): void {
    this.createForm.reset({
      nbTablesResa: 1,
      notesResa: '',
      statut: 'PAS_DE_CONTACT',
    });
    this.selectedEditeur.set(null);
    this.selectedEditeurTerm.set(null);
    this.reservationClasses.clear();
  }
}
