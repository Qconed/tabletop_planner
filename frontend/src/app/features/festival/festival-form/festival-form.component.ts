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
import { ClasseTarifaireCreateDto } from '../../../core/models/classe-tarifaire.model';
import { forkJoin } from 'rxjs';

interface ClasseTarifaireForm {
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
  @Input() festival?: Festival;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  festivalForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  errorMessage = signal<string>('');
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private festivalService: FestivalService,
    private classeTarifaireService: ClasseTarifaireService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.festival;
    this.initForm();
  }

  private initForm(): void {
    this.festivalForm = this.fb.group({
      nom: [this.festival?.nom || '', [Validators.required, Validators.minLength(3)]],
      nombre_tables: [
        this.festival?.nbTotalTables || null,
        [Validators.required, Validators.min(1), Validators.max(1000)]
      ],
      date: [this.festival?.date ? new Date(this.festival.date) : null, [Validators.required]],
      classesTarifaires: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Si mode édition, charger les classes tarifaires existantes
    if (this.isEditMode && this.festival) {
      this.loadExistingClassesTarifaires(this.festival.id);
    }
  }

  get classesTarifaires(): FormArray {
    return this.festivalForm.get('classesTarifaires') as FormArray;
  }

  private createClasseTarifaireFormGroup(libelle = '', prixTable: number | null = null, nbTotalTables: number | null = null): FormGroup {
    return this.fb.group({
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
            this.createClasseTarifaireFormGroup(classe.libelle, classe.prixTable, classe.nbTotalTables)
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

    if (this.isEditMode && this.festival) {
      // Mode édition - mise à jour du festival
      this.festivalService.update(this.festival.id, festivalDto).subscribe({
        next: (updatedFestival) => {
          this.handleClassesTarifaires(updatedFestival.id);
        },
        error: (err) => {
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
    console.log('📤 Création des classes tarifaires pour le festival', festivalId);
    
    const classesTarifairesRequests = this.classesTarifaires.value.map(
      (classe: ClasseTarifaireForm) => {
        const dto: ClasseTarifaireCreateDto = {
          idFestival: festivalId,
          libelle: classe.libelle,
          prixTable: Math.round(classe.prixTable * 100), // Convertir en centimes
          nbTotalTables: classe.nbTotalTables
        };
        console.log('📤 Envoi classe tarifaire:', dto);
        return this.classeTarifaireService.create(dto);
      }
    );

    forkJoin(classesTarifairesRequests).subscribe({
      next: (results) => {
        console.log('✅ Toutes les classes tarifaires ont été créées:', results);
        this.isSubmitting = false;
        this.formSubmitted.emit();
      },
      error: (err) => {
        console.error('❌ Erreur lors de la création des classes tarifaires:', err);
        this.isSubmitting = false;
        const errorMsg = err.error?.error || err.error?.message || err.message;
        this.errorMessage.set('Erreur lors de la création des classes tarifaires: ' + errorMsg);
      }
    });
  }

  onCancel(): void {
    this.formCancelled.emit();
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
