import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit, Optional, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { ClasseTarifaire } from '../../../../../core/models/classe-tarifaire.model';
import { Reservation, ReservationClasse, StatutWorkflow } from '../../../../../core/models/reservation.model';
import { PlacementJeu } from '../../../../../core/models/placement-jeu.model';
import { JeuReservation } from '../../../../../core/models/jeu-reservation.model';
import { ClasseTarifaireService } from '../../../../../core/services/classe-tarifaire.service';
import { ReservationClasseService } from '../../../../../core/services/reservation-classe.service';
import { ReservationService } from '../../../../../core/services/reservation.service';
import { JeuReservationService } from '../../../../../core/services/jeu-reservation.service';
import { PlacementJeuService } from '../../../../../core/services/placement-jeu.service';
import { FestivalWorkspaceStore } from '../../../../../core/store/festival-workspace.store';
import { AuthService } from '../../../../../core/services/auth.service';
import {
  AutocompleteSearchBarComponent,
  AutocompleteSearchOption
} from '../../../../../shared/components/autocomplete-search-bar/autocomplete-search-bar.component';
import { JeuService } from '../../../../../core/services/jeu.service';
import { Jeu } from '../../../../../core/models/jeu.model';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteSearchBarComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.css'
})
export class ReservationDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly reservation = signal<Reservation | null>(null);
  readonly classesTarifaires = signal<ClasseTarifaire[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedJeu = signal<Jeu | null>(null);
  readonly unplacedGames = signal<JeuReservation[]>([]);
  readonly placementsByClass = signal<Map<number, PlacementJeu[]>>(new Map());
  readonly editingPlacementId = signal<number | null>(null);
  readonly editingUnplacedGameId = signal<number | null>(null);
  readonly allGames = signal<Array<{
    jr: JeuReservation,
    pj?: PlacementJeu
  }>>([]);
  readonly currentReservationClasses = signal<Array<{ idClasseTarifaire: number, libelle: string }>>([]);

  readonly jeuOptionsProvider = (search?: string) =>
    this.jeuService.searchByName(search).pipe(
      map((jeux) =>
        jeux.map(
          (jeu): AutocompleteSearchOption<number, Jeu> => ({
            label: jeu.libelle,
            value: jeu.id,
            meta: jeu
          })
        )
      )
    );

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
    statut: ['PAS_DE_CONTACT' as StatutWorkflow, Validators.required],
    notesResa: [''],
    reservationClasses: this.fb.array([]),
  });

  private updateCurrentReservationClasses(): void {
    const res = this.reservation();
    if (!res) {
      this.currentReservationClasses.set([]);
      return;
    }

    const classes = this.reservationClasses.controls.map(control => {
      const id = Number(control.get('idClasseTarifaire')?.value);
      const classe = this.classesTarifaires().find(c => c.id === id);
      return {
        idClasseTarifaire: id,
        libelle: classe?.libelle || `Classe #${id}`
      };
    }).filter(c => c.idClasseTarifaire > 0);
    
    this.currentReservationClasses.set(classes);
  }

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: { reservationId: number },
    @Optional() private readonly dialogRef: MatDialogRef<ReservationDetailComponent>,
    private readonly classeTarifaireService: ClasseTarifaireService,
    private readonly reservationClasseService: ReservationClasseService,
    private readonly reservationService: ReservationService,
    private readonly jeuService: JeuService,
    private readonly jeuReservationService: JeuReservationService,
    private readonly placementJeuService: PlacementJeuService,
    private readonly workspaceStore: FestivalWorkspaceStore,
    public readonly authService: AuthService
  ) {
    // Sync currentReservationClasses whenever the FormArray value changes
    this.form.get('reservationClasses')?.valueChanges.pipe(
      takeUntilDestroyed()
    ).subscribe(() => this.updateCurrentReservationClasses());
  }

  get reservationClasses(): FormArray {
    return this.form.get('reservationClasses') as FormArray;
  }

  ngOnInit(): void {
    const reservationId = this.data?.reservationId;
    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      this.errorMessage.set('Identifiant de réservation invalide.');
      this.isLoading.set(false);
      return;
    }

    this.loadReservation(reservationId);
  }

  toggleEditMode(): void {
    this.isEditMode.set(!this.isEditMode());
    if (this.isEditMode()) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  addReservationClasseRow(): void {
    const firstAvailableClasseId = this.getFirstAvailableClasseId();
    if (!firstAvailableClasseId) {
      this.errorMessage.set('Toutes les classes tarifaires sont déjà utilisées dans cette réservation.');
      return;
    }

    this.reservationClasses.push(this.createReservationClasseGroup({ idClasseTarifaire: firstAvailableClasseId }));
    this.updateCurrentReservationClasses();
  }

  removeReservationClasseRow(index: number): void {
    this.reservationClasses.removeAt(index);
    this.updateCurrentReservationClasses();
  }

  getAvailableClassesForRow(rowIndex: number): ClasseTarifaire[] {
    const usedClasseIds = this.getUsedClasseIds(rowIndex);
    const currentClasseId = this.getSelectedClasseIdByRow(rowIndex);

    return this.classesTarifaires().filter((classe) => {
      if (classe.id === currentClasseId) {
        return true;
      }

      return !usedClasseIds.has(classe.id);
    });
  }

  getClasseCapacityWarning(rowIndex: number): string | null {
    const control = this.reservationClasses.at(rowIndex);
    if (!control) {
      return null;
    }

    const value = control.getRawValue() as { idClasseTarifaire: number | string; nbTables: number | string };
    const idClasseTarifaire = Number(value.idClasseTarifaire);
    const nbTables = Number(value.nbTables);

    if (idClasseTarifaire <= 0 || nbTables < 0) {
      return null;
    }

    const classeTarifaire = this.classesTarifaires().find((item) => item.id === idClasseTarifaire);
    if (!classeTarifaire) {
      return null;
    }

    if (nbTables > classeTarifaire.nbTotalTables) {
      return `Attention: ${nbTables} table(s) dépasse la capacité de cette classe (${classeTarifaire.nbTotalTables}).`;
    }

    return null;
  }

  getSelectedTablesTotal(): number {
    return this.reservationClasses.controls.reduce((total, control) => {
      const value = control.getRawValue() as {
        idClasseTarifaire: number | string;
        nbTables: number | string;
      };
      const idClasseTarifaire = Number(value.idClasseTarifaire);
      const nbTables = Number(value.nbTables);

      if (idClasseTarifaire <= 0 || nbTables <= 0) {
        return total;
      }

      return total + nbTables;
    }, 0);
  }

  hasAvailableClasses(): boolean {
    return this.getFirstAvailableClasseId() > 0;
  }

  save(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    const reservation = this.reservation();
    if (!reservation) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Le formulaire contient des erreurs.');
      return;
    }

    const reservationClasses = this.reservationClasses.controls
      .map((control) => control.getRawValue() as {
        id: number | string;
        idClasseTarifaire: number | string;
        nbTables: number | string;
      })
      .map((value) => ({
        id: Number(value.id),
        idClasseTarifaire: Number(value.idClasseTarifaire),
        nbTables: Number(value.nbTables),
      }))
      .filter((value) => value.idClasseTarifaire > 0 && value.nbTables > 0);

    if (reservationClasses.length === 0) {
      this.errorMessage.set('Ajouter au moins une classe tarifaire est obligatoire.');
      return;
    }

    const selectedClasseIds = reservationClasses.map((value) => value.idClasseTarifaire);
    if (new Set(selectedClasseIds).size !== selectedClasseIds.length) {
      this.errorMessage.set('Une classe tarifaire ne peut être sélectionnée qu\'une seule fois.');
      return;
    }

    const totalTables = this.getSelectedTablesTotal();
    const formValue = this.form.getRawValue();

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.reservationService.update(reservation.id, {
      nbTablesResa: totalTables,
      statut: formValue.statut,
      notesResa: formValue.notesResa.trim() || undefined,
    }).pipe(
      switchMap(() => this.syncReservationClasses(reservation.id, reservationClasses)),
      switchMap(() => this.reservationService.getById(reservation.id)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (updatedReservation) => {
        this.setReservationInForm(updatedReservation);
        this.successMessage.set('Réservation mise à jour.');
        this.isSaving.set(false);
        this.isEditMode.set(false);
        this.form.disable();
        if (this.dialogRef) {
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        const zodDetails = error?.error?.details?.[0]?.message as string | undefined;
        this.errorMessage.set(zodDetails ?? error?.error?.error ?? 'Impossible de mettre à jour la réservation.');
        this.isSaving.set(false);
      },
    });
  }

  deleteReservation(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    const reservation = this.reservation();

    if (!reservation) {
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
        if (this.dialogRef) {
          this.dialogRef.close(true);
        }
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.error ?? 'Impossible de supprimer la réservation.');
        this.isSaving.set(false);
      },
    });
  }

  close(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  formatStatut(statut: StatutWorkflow): string {
    return statut.replaceAll('_', ' ');
  }

  onJeuOptionSelected(option: AutocompleteSearchOption): void {
    const jeu = option.meta as Jeu | undefined;
    if (!jeu) return;

    const reservation = this.reservation();
    if (!reservation) return;

    const alreadyExists = reservation.jeuxReservations?.some(jr => jr.idJeu === jeu.id);
    if (alreadyExists) {
      this.errorMessage.set('Ce jeu est déjà présent dans la réservation.');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    this.isSaving.set(true);
    this.jeuReservationService.create({
      idReservation: reservation.id,
      idJeu: jeu.id,
      quantite: 1
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newJr) => {
        this.refreshReservation();
        this.successMessage.set(`${jeu.libelle} ajouté à la réservation.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.errorMessage.set('Erreur lors de l\'ajout du jeu.');
        this.isSaving.set(false);
      }
    });
  }

  onGameClassChange(jr: JeuReservation, newClassId: number, currentPj?: PlacementJeu): void {
    const reservation = this.reservation();
    if (!reservation) return;

    this.isSaving.set(true);

    if (newClassId === 0) {
      if (currentPj) {
        this.placementJeuService.delete(currentPj.id).subscribe({
          next: () => this.refreshReservation(),
          error: () => this.isSaving.set(false)
        });
      } else {
        this.isSaving.set(false);
      }
    } else {
      if (currentPj) {
        this.placementJeuService.update(currentPj.id, { idClasseTarifaire: newClassId }).subscribe({
          next: () => this.refreshReservation(),
          error: () => this.isSaving.set(false)
        });
      } else {
        this.placementJeuService.create({
          idReservation: reservation.id,
          idJeu: jr.idJeu,
          idClasseTarifaire: newClassId,
          nbTables: 1,
          quantiteJeu: jr.quantite
        }).subscribe({
          next: () => this.refreshReservation(),
          error: () => this.isSaving.set(false)
        });
      }
    }
  }

  updateGameQuantity(jr: JeuReservation, quantite: number): void {
    if (quantite < 1) return;
    this.isSaving.set(true);
    this.jeuReservationService.update(jr.idReservation, jr.idJeu, { quantite }).subscribe({
      next: () => this.refreshReservation(),
      error: () => this.isSaving.set(false)
    });
  }

  updateGameTables(pj: PlacementJeu, nbTables: number): void {
    if (nbTables < 1) return;
    this.isSaving.set(true);
    this.placementJeuService.update(pj.id, { nbTables }).subscribe({
      next: () => this.refreshReservation(),
      error: () => this.isSaving.set(false)
    });
  }

  deleteGameFromReservation(jr: JeuReservation): void {
    if (!confirm(`Supprimer ${jr.jeu?.libelle} de la réservation ?`)) return;
    this.isSaving.set(true);
    this.jeuReservationService.delete(jr.idReservation, jr.idJeu).subscribe({
      next: () => this.refreshReservation(),
      error: () => this.isSaving.set(false)
    });
  }

  private refreshReservation(): void {
    const res = this.reservation();
    if (!res) return;
    this.reservationService.getById(res.id).subscribe({
      next: (updated) => {
        // If we are in edit mode, we only update game-related signals
        // to avoid resetting the FormArray which might contain unsaved rows
        this.setReservationInForm(updated, this.isEditMode());
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false)
    });
  }

  private loadReservation(reservationId: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getById(reservationId).pipe(
      switchMap((reservation) => {
        return this.classeTarifaireService.getByFestival(reservation.idFestival).pipe(
          map((classesTarifaires) => ({ reservation, classesTarifaires }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ reservation, classesTarifaires }) => {
        this.classesTarifaires.set(classesTarifaires);
        this.setReservationInForm(reservation);
        if (this.reservationClasses.length === 0) {
          this.addReservationClasseRow();
        }
        this.ensureClasseSelectionDefaults();
        this.isLoading.set(false);
        this.isEditMode.set(false);
        this.form.disable();
      },
      error: () => {
        this.errorMessage.set('Réservation introuvable.');
        this.isLoading.set(false);
      },
    });
  }

  private syncReservationClasses(
    reservationId: number,
    formClasses: Array<{ id: number; idClasseTarifaire: number; nbTables: number }>
  ) {
    const currentReservation = this.reservation();
    const existingClasses = currentReservation?.reservationClasses ?? [];
    const existingById = new Map<number, ReservationClasse>(
      existingClasses.map((reservationClasse) => [reservationClasse.id, reservationClasse])
    );

    const keptIds = new Set<number>(formClasses.filter((item) => item.id > 0).map((item) => item.id));
    const deleteOperations = existingClasses
      .filter((item) => !keptIds.has(item.id))
      .map((item) => this.reservationClasseService.delete(item.id));

    const updateOperations: Array<ReturnType<ReservationClasseService['update']>> = [];
    const createOperations: Array<ReturnType<ReservationClasseService['create']>> = [];

    for (const formClasse of formClasses) {
      if (formClasse.id > 0) {
        const existing = existingById.get(formClasse.id);

        if (!existing) {
          createOperations.push(this.reservationClasseService.create({
            idReservation: reservationId,
            idClasseTarifaire: formClasse.idClasseTarifaire,
            nbTables: formClasse.nbTables,
          }));
          continue;
        }

        if (existing.idClasseTarifaire !== formClasse.idClasseTarifaire) {
          deleteOperations.push(this.reservationClasseService.delete(formClasse.id));
          createOperations.push(this.reservationClasseService.create({
            idReservation: reservationId,
            idClasseTarifaire: formClasse.idClasseTarifaire,
            nbTables: formClasse.nbTables,
          }));
          continue;
        }

        updateOperations.push(this.reservationClasseService.update(formClasse.id, {
          nbTables: formClasse.nbTables,
        }));
        continue;
      }

      createOperations.push(this.reservationClasseService.create({
        idReservation: reservationId,
        idClasseTarifaire: formClasse.idClasseTarifaire,
        nbTables: formClasse.nbTables,
      }));
    }

    const operations = [...deleteOperations, ...updateOperations, ...createOperations];
    if (operations.length === 0) {
      return of(null);
    }

    return forkJoin(operations);
  }

  private setReservationInForm(reservation: Reservation, onlyUpdateGames: boolean = false): void {
    this.reservation.set(reservation);

    if (!onlyUpdateGames) {
      this.form.patchValue({
        statut: reservation.statut,
        notesResa: reservation.notesResa ?? '',
      });

      this.reservationClasses.clear();
      const reservationClasses = reservation.reservationClasses ?? [];
      for (const reservationClasse of reservationClasses) {
        this.reservationClasses.push(this.createReservationClasseGroup({
          id: reservationClasse.id,
          idClasseTarifaire: reservationClasse.idClasseTarifaire,
          nbTables: reservationClasse.nbTables,
        }));
      }
    }

    const allJr = reservation.jeuxReservations || [];
    const allPj = reservation.placementsJeux || [];

    const map = new Map<number, PlacementJeu[]>();
    allPj.forEach(pj => {
      const list = map.get(pj.idClasseTarifaire) || [];
      list.push(pj);
      map.set(pj.idClasseTarifaire, list);
    });
    this.placementsByClass.set(map);

    const games = allJr.map(jr => ({
      jr,
      pj: allPj.find(pj => Number(pj.idJeu) === Number(jr.idJeu))
    }));
    this.allGames.set(games);
    this.updateCurrentReservationClasses();
  }

  getTablesUsedInClass(idClasseTarifaire: number): number {
    const placements = this.placementsByClass().get(idClasseTarifaire) || [];
    return placements.reduce((total, pj) => total + pj.nbTables, 0);
  }

  private createReservationClasseGroup(initial?: {
    id?: number;
    idClasseTarifaire?: number;
    nbTables?: number;
  }) {
    return this.fb.nonNullable.group({
      id: [initial?.id ?? 0],
      idClasseTarifaire: [initial?.idClasseTarifaire ?? 0, [Validators.required, Validators.min(1)]],
      nbTables: [initial?.nbTables ?? 1, [Validators.required, Validators.min(1)]],
    });
  }

  private ensureClasseSelectionDefaults(): void {
    for (let rowIndex = 0; rowIndex < this.reservationClasses.length; rowIndex += 1) {
      const control = this.reservationClasses.at(rowIndex);
      if (!control) {
        continue;
      }

      const currentValue = Number(control.get('idClasseTarifaire')?.value ?? 0);
      if (currentValue > 0) {
        continue;
      }

      const firstAvailableClasseId = this.getFirstAvailableClasseId(rowIndex);
      if (firstAvailableClasseId > 0) {
        control.patchValue({ idClasseTarifaire: firstAvailableClasseId });
      }
    }
  }

  private getFirstAvailableClasseId(rowIndex?: number): number {
    const usedClasseIds = this.getUsedClasseIds(rowIndex);
    const firstAvailable = this.classesTarifaires().find((classe) => !usedClasseIds.has(classe.id));
    return firstAvailable?.id ?? 0;
  }

  private getUsedClasseIds(excludedRowIndex?: number): Set<number> {
    const ids = new Set<number>();

    this.reservationClasses.controls.forEach((control, index) => {
      if (excludedRowIndex !== undefined && index === excludedRowIndex) {
        return;
      }

      const value = control.getRawValue() as { idClasseTarifaire: number | string };
      const idClasseTarifaire = Number(value.idClasseTarifaire);
      if (idClasseTarifaire > 0) {
        ids.add(idClasseTarifaire);
      }
    });

    return ids;
  }

  private getSelectedClasseIdByRow(rowIndex: number): number {
    const control = this.reservationClasses.at(rowIndex);
    if (!control) {
      return 0;
    }

    const value = control.getRawValue() as { idClasseTarifaire: number | string };
    return Number(value.idClasseTarifaire);
  }
}
