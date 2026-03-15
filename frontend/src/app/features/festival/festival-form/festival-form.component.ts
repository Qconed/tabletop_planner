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
import { FestivalService } from '../../../core/services/festival.service';
import { ClasseTarifaireService } from '../../../core/services/classe-tarifaire.service';
import { Festival, FestivalCreateDto } from '../../../core/models/festival.model';
import { ClasseTarifaire, ClasseTarifaireCreateDto } from '../../../core/models/classe-tarifaire.model';
import { forkJoin } from 'rxjs';

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

  festivalForm!: FormGroup;
  festival?: Festival;
  viewMode = signal(true); // Start in view mode when festivalId is provided
  isSubmitting = false;
  errorMessage = signal<string>('');
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
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
        this.loadExistingClassesTarifaires(id);
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
      classesTarifaires: this.fb.array([], [Validators.required, Validators.minLength(1)])
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
    this.classesTarifaires.push(this.createClasseTarifaireFormGroup());
  }

  removeClasseTarifaire(index: number): void {
    this.classesTarifaires.removeAt(index);
  }

  private loadExistingClassesTarifaires(festivalId: number): void {
    this.classeTarifaireService.getByFestival(festivalId).subscribe({
      next: (classes) => {
        classes.forEach(classe => {
          this.classesTarifaires.push(
            this.createClasseTarifaireFormGroup(
              classe.id,
              classe.libelle,
              classe.prixTable / 100, // Convert from centimes to euros
              classe.nbTotalTables
            )
          );
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des classes tarifaires:', err);
      }
    });
  }

  // Validation personnalisée pour vérifier les noms uniques
  private validateUniqueNames(): boolean {
    const names = this.classesTarifaires.value.map((ct: ClasseTarifaireForm) => ct.libelle.toLowerCase());
    const uniqueNames = new Set(names);
    return names.length === uniqueNames.size;
  }

  onSubmit(): void {
    if (this.festivalForm.invalid) {
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
    
    const festivalDto: FestivalCreateDto = {
      nom: formValue.nom,
      nbTotalTables: formValue.nombre_tables,
      date: dateValue
    };
    
    console.log('📤 Envoi des données du festival:', festivalDto);

    if (this.festivalId) {
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
      // Mode création
      this.festivalService.create(festivalDto).subscribe({
        next: (createdFestival) => {
          console.log('✅ Festival créé avec succès:', createdFestival);
          this.handleClassesTarifaires(createdFestival.id);
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
          const dto: ClasseTarifaireCreateDto = {
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

    forkJoin(classesTarifairesRequests).subscribe({
      next: (results) => {
        console.log('✅ Toutes les classes tarifaires ont été traitées:', results);
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
