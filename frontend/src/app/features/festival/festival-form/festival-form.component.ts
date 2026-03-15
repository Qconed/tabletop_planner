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
import { Festival, FestivalCreateDto } from '../../../core/models/festival.model';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface ClasseTarifaireForm {
  id?: number;
  libelle: string;
  prixTable: number;
  nbTotalTables: number;
}

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
      // Load festival data if ID is provided
      this.viewMode.set(true);
      this.loadFestivalData(this.festivalId);
    } else {
      // Creation mode - start in edit mode
      this.viewMode.set(false);
    }
  }

  private loadFestivalData(id: number): void {
    this.festivalService.getById(id).subscribe({
      next: (festival) => {
        this.festival = festival;
        this.updateFormValues(festival);
        this.loadExistingClassesTarifaires(festival);
        // Disable form initially in view mode
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
    this.festivalForm.patchValue({
      nom: festival.nom,
      nombre_tables: festival.nbTotalTables,
      date: new Date(festival.date)
    });
  }

  switchToEditMode(): void {
    this.errorMessage.set('');
    this.viewMode.set(false);
    this.festivalForm.enable();
  }

  private initForm(): void {
    this.festivalForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
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

  private createClasseTarifaireFormGroup(id?: number, libelle = '', prixTable: number | null = null, nbTotalTables: number | null = null): FormGroup {
    return this.fb.group({
      id: [id], // Store the ID if it exists (for updates)
      libelle: [libelle, [Validators.required, Validators.minLength(2)]],
      prixTable: [prixTable, [Validators.required, Validators.min(0)]],
      nbTotalTables: [nbTotalTables, [Validators.required, Validators.min(1)]]
    });
  }

  addClasseTarifaire(): void {
    this.errorMessage.set('');
    this.classesTarifaires.push(this.createClasseTarifaireFormGroup());
  }

  removeClasseTarifaire(index: number): void {
    const classeControl = this.classesTarifaires.at(index);
    const classeId = classeControl.get('id')?.value as number | null | undefined;

    if (this.isEditMode && classeId && !this.canRemovePersistedClasseTarifaire()) {
      this.errorMessage.set('Un festival existant doit conserver au moins une classe tarifaire enregistrée.');
      return;
    }

    this.errorMessage.set('');

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
      this.classesTarifaires.push(
        this.createClasseTarifaireFormGroup(
          classe.id,
          classe.libelle,
          classe.prixTable / 100,
          classe.nbTotalTables
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

  // Validation personnalisée pour vérifier les noms uniques
  private validateUniqueNames(): boolean {
    const names = this.classesTarifaires.value.map((ct: ClasseTarifaireForm) => ct.libelle.trim().toLowerCase());
    const uniqueNames = new Set(names);
    return names.length === uniqueNames.size;
  }

  private validateClassesTarifairesOnSubmit(): boolean {
    if (this.classesTarifaires.length === 0) {
      this.errorMessage.set('Au moins une classe tarifaire est requise.');
      return false;
    }

    if (
      this.isEditMode
      && this.initialPersistedClassesTarifairesCount > 0
      && this.persistedClasseTarifairesCount === 0
    ) {
      this.errorMessage.set('Un festival existant doit conserver au moins une classe tarifaire enregistrée.');
      return false;
    }

    return true;
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

    this.isSubmitting = true;
    this.errorMessage.set('');

    this.festivalService.delete(this.festivalId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.festivalDeleted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la suppression du festival:', err);
        this.isSubmitting = false;
        const errorMsg = err.error?.error || err.error?.message || err.message;
        this.errorMessage.set('Erreur lors de la suppression du festival: ' + errorMsg);
      }
    });
  }

  onSubmit(): void {
    if (this.festivalForm.invalid) {
      this.festivalForm.markAllAsTouched();
      return;
    }

    if (!this.validateClassesTarifairesOnSubmit()) {
      this.festivalForm.markAllAsTouched();
      return;
    }

    if (!this.validateUniqueNames()) {
      this.errorMessage.set('Les noms des classes tarifaires doivent être uniques.');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage.set('');

    const formValue = this.festivalForm.value;
    
    // Conversion de la date en ISO string
    const dateValue = formValue.date instanceof Date ? formValue.date.toISOString() : formValue.date;
    
    if (this.festivalId) {
      const festivalDto = {
        nom: formValue.nom,
        nbTotalTables: formValue.nombre_tables,
        date: dateValue
      };

      console.log('📤 Envoi des données du festival:', festivalDto);

      // Mode édition - mise à jour du festival
      this.festivalService.update(this.festivalId, festivalDto).subscribe({
        next: (updatedFestival) => {
          console.log('✅ Festival mis à jour avec succès:', updatedFestival);
          this.handleClassesTarifaires(updatedFestival.id);
        },
        error: (err) => {
          console.error('❌ Erreur lors de la mise à jour du festival:', err);
          this.isSubmitting = false;
          this.errorMessage.set('Erreur lors de la mise à jour du festival: ' + (err.error?.message || err.message));
        }
      });
    } else {
      const festivalDto: FestivalCreateDto = {
        nom: formValue.nom,
        nbTotalTables: formValue.nombre_tables,
        date: dateValue,
        classesTarifaires: this.classesTarifaires.value.map((classe: ClasseTarifaireForm) => ({
          libelle: classe.libelle,
          prixTable: Math.round(classe.prixTable * 100),
          nbTotalTables: classe.nbTotalTables
        }))
      };

      console.log('📤 Envoi du festival et des classes tarifaires:', festivalDto);

      // Mode création
      this.festivalService.create(festivalDto).subscribe({
        next: (createdFestival) => {
          console.log('✅ Festival et classes tarifaires créés avec succès:', createdFestival);
          this.isSubmitting = false;
          this.formSubmitted.emit();
        },
        error: (err) => {
          console.error('❌ Erreur lors de la création du festival:', err);
          console.error('📋 Détails de l\'erreur:', err.error);
          this.isSubmitting = false;
          const errorMsg = err.error?.error || err.error?.message || err.message;
          const details = err.error?.details ? '\nDétails: ' + JSON.stringify(err.error.details) : '';
          this.errorMessage.set('Erreur lors de la création du festival: ' + errorMsg + details);
        }
      });
    }
  }

  private handleClassesTarifaires(festivalId: number): void {
    console.log('📤 Gestion des classes tarifaires pour le festival', festivalId);

    const deletedClassesRequests = Array.from(this.removedClasseTarifaireIds).map((classeId) => {
      console.log('📤 Suppression classe tarifaire:', classeId);
      return this.classeTarifaireService.delete(classeId);
    });

    const classesTarifairesRequests = this.classesTarifaires.value.map(
      (classe: ClasseTarifaireForm) => {
        const prixEnCentimes = Math.round(classe.prixTable * 100); // Convertir en centimes
        
        if (classe.id) {
          // Update existing classe tarifaire
          console.log('📤 Mise à jour classe tarifaire:', classe.id);
          return this.classeTarifaireService.update(classe.id, {
            libelle: classe.libelle,
            prixTable: prixEnCentimes,
            nbTotalTables: classe.nbTotalTables
          });
        } else {
          // Create new classe tarifaire
          const dto = {
            idFestival: festivalId,
            libelle: classe.libelle,
            prixTable: prixEnCentimes,
            nbTotalTables: classe.nbTotalTables
          };
          console.log('📤 Création classe tarifaire:', dto);
          return this.classeTarifaireService.create(dto);
        }
      }
    );

    const requests = [...deletedClassesRequests, ...classesTarifairesRequests];

    if (requests.length === 0) {
      this.isSubmitting = false;
      this.formSubmitted.emit();
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('✅ Toutes les classes tarifaires ont été traitées:', results);
        this.removedClasseTarifaireIds.clear();
        this.isSubmitting = false;
        this.formSubmitted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la gestion des classes tarifaires:', err);
        this.isSubmitting = false;
        const errorMsg = err.error?.error || err.error?.message || err.message;
        this.errorMessage.set('Erreur lors de la gestion des classes tarifaires: ' + errorMsg);
      }
    });
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

  // Getters pour les messages d'erreur
  get nomError(): string {
    const control = this.festivalForm.get('nom');
    if (control?.hasError('required')) return 'Le nom est requis';
    if (control?.hasError('minlength')) return 'Le nom doit contenir au moins 3 caractères';
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
    if (control?.hasError('minlength')) return 'Le nom doit contenir au moins 2 caractères';
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
