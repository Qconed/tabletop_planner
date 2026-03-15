import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { FestivalService } from '../../../core/services/festival.service';
import { ClasseTarifaireService } from '../../../core/services/classe-tarifaire.service';
import { Festival } from '../../../core/models/festival.model';
import { Observable, forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClasseTarifaireForm, FestivalFormValue } from './festival-form.types';
import {
  MIN_CLASSE_NAME_LENGTH,
  MIN_FESTIVAL_NAME_LENGTH,
  PERSISTED_CLASSE_REQUIRED_MESSAGE,
  buildClasseTarifaireCreateDto,
  buildClasseTarifaireUpdateDto,
  buildFestivalCreateDto,
  buildFestivalUpdateDto,
  extractApiErrorMessage,
  hasUniqueClasseNames,
  mapClasseTarifaireToFormValue,
  mapFestivalToFormValue,
  validateClassesTarifairesBeforeSubmit
} from './festival-form.utils';

@Component({
  selector: 'app-festival-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './festival-form.component.html',
  styleUrls: ['./festival-form.component.css']
})
export class FestivalFormComponent implements OnInit {
  @Input() festivalId?: number | null;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();
  @Output() festivalDeleted = new EventEmitter<void>();

  festivalForm!: FormGroup;
  festival?: Festival;
  viewMode = signal(true); // Start in view mode when festivalId is provided
  isSubmitting = false;
  errorMessage = signal<string>('');
  minDate = new Date();
  private removedClasseTarifaireIds = new Set<number>();
  private initialPersistedClassesTarifairesCount = 0;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private festivalService: FestivalService,
    private classeTarifaireService: ClasseTarifaireService
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.festivalId) {
      this.viewMode.set(true);
      this.loadFestivalData(this.festivalId);
    } else {
      this.viewMode.set(false);
    }
  }

  private loadFestivalData(id: number): void {
    this.festivalService.getById(id).subscribe({
      next: (festival) => {
        this.festival = festival;
        this.updateFormValues(festival);
        this.loadExistingClassesTarifaires(festival);
        if (this.viewMode()) {
          this.festivalForm.disable();
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement du festival:', err);
        this.errorMessage.set('Erreur lors du chargement du festival');
      }
    });
  }

  private updateFormValues(festival: Festival): void {
    this.festivalForm.patchValue(mapFestivalToFormValue(festival));
  }

  switchToEditMode(): void {
    this.clearError();
    this.viewMode.set(false);
    this.festivalForm.enable();
  }

  private initForm(): void {
    this.festivalForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(MIN_FESTIVAL_NAME_LENGTH)]],
      nombre_tables: [
        null,
        [Validators.required, Validators.min(1)]
      ],
      date: [null, [Validators.required]],
      classesTarifaires: this.fb.array([])
    });
  }

  get classesTarifaires(): FormArray {
    return this.festivalForm.get('classesTarifaires') as FormArray;
  }

  private createClasseTarifaireFormGroup(
    id?: number,
    libelle = '',
    prixTable: number | null = null,
    nbTotalTables: number | null = null
  ): FormGroup {
    return this.fb.group({
      id: [id],
      libelle: [libelle, [Validators.required, Validators.minLength(MIN_CLASSE_NAME_LENGTH)]],
      prixTable: [prixTable, [Validators.required, Validators.min(0)]],
      nbTotalTables: [nbTotalTables, [Validators.required, Validators.min(1)]]
    });
  }

  addClasseTarifaire(): void {
    this.clearError();
    this.classesTarifaires.push(this.createClasseTarifaireFormGroup());
  }

  removeClasseTarifaire(index: number): void {
    const classeControl = this.classesTarifaires.at(index);
    const classeId = classeControl.get('id')?.value as number | null | undefined;

    if (this.isEditMode && classeId && !this.canRemovePersistedClasseTarifaire()) {
      this.errorMessage.set(PERSISTED_CLASSE_REQUIRED_MESSAGE);
      return;
    }

    this.clearError();

    if (this.isEditMode && classeId) {
      this.removedClasseTarifaireIds.add(classeId);
    }

    this.classesTarifaires.removeAt(index);
  }

  private loadExistingClassesTarifaires(festival: Festival): void {
    this.classesTarifaires.clear();
    this.removedClasseTarifaireIds.clear();

    const classesTarifaires = festival.classesTarifaires ?? [];
    this.initialPersistedClassesTarifairesCount = classesTarifaires.filter((classe) => !!classe.id).length;

    classesTarifaires.forEach((classe) => {
      const classeFormValue = mapClasseTarifaireToFormValue(classe);
      this.classesTarifaires.push(
        this.createClasseTarifaireFormGroup(
          classeFormValue.id,
          classeFormValue.libelle,
          classeFormValue.prixTable,
          classeFormValue.nbTotalTables
        )
      );
    });
  }

  private canRemovePersistedClasseTarifaire(): boolean {
    return this.persistedClasseTarifairesCount > 1;
  }

  private get persistedClasseTarifairesCount(): number {
    return this.classesTarifaires.controls.filter((classe) => !!classe.get('id')?.value).length;
  }

  confirmDeleteFestival(): void {
    if (!this.festivalId || !this.festival) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: 'Supprimer le festival',
        message: `Supprimer le festival "${this.festival.nom}" ? Les classes tarifaires associées seront aussi supprimées.`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteFestival();
      }
    });
  }

  private deleteFestival(): void {
    if (!this.festivalId) {
      return;
    }

    this.startSubmitting();

    this.festivalService.delete(this.festivalId).subscribe({
      next: () => {
        this.stopSubmitting();
        this.festivalDeleted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la suppression du festival:', err);
        this.stopSubmitting();
        this.errorMessage.set('Erreur lors de la suppression du festival: ' + extractApiErrorMessage(err));
      }
    });
  }

  onSubmit(): void {
    if (!this.canSubmitForm()) {
      return;
    }

    this.startSubmitting();
    const formValue = this.getFormValue();

    if (this.isEditMode && this.festivalId) {
      this.submitFestivalUpdate(this.festivalId, formValue);
      return;
    }

    this.submitFestivalCreate(formValue);
  }

  private canSubmitForm(): boolean {
    if (this.festivalForm.invalid) {
      this.festivalForm.markAllAsTouched();
      return false;
    }

    const classesError = validateClassesTarifairesBeforeSubmit({
      classesCount: this.classesTarifaires.length,
      isEditMode: this.isEditMode,
      initialPersistedCount: this.initialPersistedClassesTarifairesCount,
      persistedCount: this.persistedClasseTarifairesCount
    });

    if (classesError) {
      this.errorMessage.set(classesError);
      this.festivalForm.markAllAsTouched();
      return false;
    }

    if (!hasUniqueClasseNames(this.classesTarifaires.value as ClasseTarifaireForm[])) {
      this.errorMessage.set('Les noms des classes tarifaires doivent être uniques.');
      return false;
    }

    return true;
  }

  private submitFestivalUpdate(festivalId: number, formValue: FestivalFormValue): void {
    const festivalDto = buildFestivalUpdateDto(formValue);

    console.log('📤 Envoi des données du festival:', festivalDto);

    this.festivalService.update(festivalId, festivalDto).subscribe({
      next: (updatedFestival) => {
        console.log('✅ Festival mis à jour avec succès:', updatedFestival);
        this.syncClassesTarifaires(updatedFestival.id);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la mise à jour du festival:', err);
        this.stopSubmitting();
        this.errorMessage.set('Erreur lors de la mise à jour du festival: ' + extractApiErrorMessage(err));
      }
    });
  }

  private submitFestivalCreate(formValue: FestivalFormValue): void {
    const festivalDto = buildFestivalCreateDto(formValue);

    console.log('📤 Envoi du festival et des classes tarifaires:', festivalDto);

    this.festivalService.create(festivalDto).subscribe({
      next: (createdFestival) => {
        console.log('✅ Festival et classes tarifaires créés avec succès:', createdFestival);
        this.stopSubmitting();
        this.formSubmitted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la création du festival:', err);
        console.error('📋 Détails de l\'erreur:', err.error);
        this.stopSubmitting();
        const details = err.error?.details ? '\nDétails: ' + JSON.stringify(err.error.details) : '';
        this.errorMessage.set('Erreur lors de la création du festival: ' + extractApiErrorMessage(err) + details);
      }
    });
  }

  private syncClassesTarifaires(festivalId: number): void {
    console.log('📤 Gestion des classes tarifaires pour le festival', festivalId);

    const requests = this.buildClasseTarifaireSyncRequests(festivalId);

    if (requests.length === 0) {
      this.stopSubmitting();
      this.formSubmitted.emit();
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('✅ Toutes les classes tarifaires ont été traitées:', results);
        this.removedClasseTarifaireIds.clear();
        this.stopSubmitting();
        this.formSubmitted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la gestion des classes tarifaires:', err);
        this.stopSubmitting();
        this.errorMessage.set('Erreur lors de la gestion des classes tarifaires: ' + extractApiErrorMessage(err));
      }
    });
  }

  private buildClasseTarifaireSyncRequests(festivalId: number): Observable<unknown>[] {
    return [
      ...this.buildClasseTarifaireDeleteRequests(),
      ...this.buildClasseTarifaireUpsertRequests(festivalId)
    ];
  }

  private buildClasseTarifaireDeleteRequests(): Observable<unknown>[] {
    return Array.from(this.removedClasseTarifaireIds).map((classeId) => {
      console.log('📤 Suppression classe tarifaire:', classeId);
      return this.classeTarifaireService.delete(classeId);
    });
  }

  private buildClasseTarifaireUpsertRequests(festivalId: number): Observable<unknown>[] {
    return this.classesTarifaires.value.map((classe: ClasseTarifaireForm) => {
      if (classe.id) {
        console.log('📤 Mise à jour classe tarifaire:', classe.id);
        return this.classeTarifaireService.update(classe.id, buildClasseTarifaireUpdateDto(classe));
      }

      const dto = buildClasseTarifaireCreateDto(festivalId, classe);
      console.log('📤 Création classe tarifaire:', dto);
      return this.classeTarifaireService.create(dto);
    });
  }

  private getFormValue(): FestivalFormValue {
    return this.festivalForm.value as FestivalFormValue;
  }

  private startSubmitting(): void {
    this.isSubmitting = true;
    this.clearError();
  }

  private stopSubmitting(): void {
    this.isSubmitting = false;
  }

  private clearError(): void {
    this.errorMessage.set('');
  }

  onCancel(): void {
    this.formCancelled.emit();
  }

  canRemoveClasseTarifaire(index: number): boolean {
    const classeId = this.classesTarifaires.at(index).get('id')?.value as number | null | undefined;

    if (!this.isEditMode || !classeId) {
      return true;
    }

    return this.canRemovePersistedClasseTarifaire();
  }

  get isEditMode(): boolean {
    return !!this.festivalId;
  }

  get isViewMode(): boolean {
    return this.viewMode();
  }

  get nomError(): string {
    const control = this.festivalForm.get('nom');
    if (control?.hasError('required')) return 'Le nom est requis';
    if (control?.hasError('minlength')) return `Le nom doit contenir au moins ${MIN_FESTIVAL_NAME_LENGTH} caractères`;
    return '';
  }

  get nombreTablesError(): string {
    const control = this.festivalForm.get('nombre_tables');
    if (control?.hasError('required')) return 'Le nombre de tables est requis';
    if (control?.hasError('min')) return 'Le nombre de tables doit être au moins 1';
    if (control?.hasError('max')) return 'Le nombre de tables ne peut pas dépasser 1000';
    return '';
  }

  get dateError(): string {
    const control = this.festivalForm.get('date');
    if (control?.hasError('required')) return 'La date est requise';
    return '';
  }

  getClasseTarifaireLibelleError(index: number): string {
    const control = this.classesTarifaires.at(index).get('libelle');
    if (control?.hasError('required')) return 'Le nom est requis';
    if (control?.hasError('minlength')) return `Le nom doit contenir au moins ${MIN_CLASSE_NAME_LENGTH} caractères`;
    return '';
  }

  getClasseTarifairePrixTableError(index: number): string {
    const control = this.classesTarifaires.at(index).get('prixTable');
    if (control?.hasError('required')) return 'Le prix est requis';
    if (control?.hasError('min')) return 'Le prix doit être positif';
    return '';
  }

  getClasseTarifaireNbTablesError(index: number): string {
    const control = this.classesTarifaires.at(index).get('nbTotalTables');
    if (control?.hasError('required')) return 'Le nombre de tables est requis';
    if (control?.hasError('min')) return 'Le nombre de tables doit être au moins 1';
    return '';
  }
}
