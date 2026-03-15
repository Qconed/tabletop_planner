import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { Editeur } from '../../core/models/editeur.model';
import { EditeurService } from '../../core/services/editeur.service';
import { DebouncedInputDirective } from '../../shared/directives/debounced-input.directive';

@Component({
  selector: 'app-reservations',
  imports: [
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DebouncedInputDirective
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnInit, OnDestroy {
  readonly searchTerm = signal('');
  readonly selectedEditeur = signal<Editeur | null>(null);
  readonly isLoading = signal(false);
  readonly editeurs = signal<Editeur[]>([]);
  private activeSearchSubscription?: Subscription;

  readonly hasSearchValue = computed(() => this.searchTerm().trim().length > 0);

  constructor(private readonly editeurService: EditeurService) {}

  ngOnInit(): void {
    this.fetchEditeurs();
  }

  onDebouncedSearch(value: string): void {
    const normalized = value.trim();

    if (normalized === this.searchTerm()) {
      return;
    }

    this.searchTerm.set(normalized);
    this.selectedEditeur.set(null);

    this.fetchEditeurs(normalized || undefined);
  }

  onInputFocus(trigger: MatAutocompleteTrigger): void {
    if (this.editeurs().length > 0) {
      trigger.openPanel();
      return;
    }

    this.fetchEditeurs(undefined, trigger);
  }

  private fetchEditeurs(search?: string, trigger?: MatAutocompleteTrigger): void {
    this.activeSearchSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.activeSearchSubscription = this.editeurService
      .searchByName(search)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la recherche des editeurs:', error);
          return of([]);
        })
      )
      .subscribe((editeurs) => {
        this.editeurs.set(editeurs);
        this.isLoading.set(false);

        if (trigger) {
          trigger.openPanel();
        }
      });
  }

  onOptionSelected(libelle: string): void {
    const selected = this.editeurs().find((editeur) => editeur.libelle === libelle) ?? null;
    this.selectedEditeur.set(selected);
    this.searchTerm.set(libelle);
  }

  ngOnDestroy(): void {
    this.activeSearchSubscription?.unsubscribe();
  }
}
