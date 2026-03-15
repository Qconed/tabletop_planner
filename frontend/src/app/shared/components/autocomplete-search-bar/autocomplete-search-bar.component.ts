import { Component, OnDestroy, OnInit, computed, input, output, signal } from '@angular/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subscription, catchError, of } from 'rxjs';
import { DebouncedInputDirective } from '../../directives/debounced-input.directive';

export interface AutocompleteSearchOption<TValue = unknown, TMeta = unknown> {
  label: string;
  value: TValue;
  meta?: TMeta;
}

@Component({
  selector: 'app-autocomplete-search-bar',
  imports: [
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    DebouncedInputDirective
  ],
  templateUrl: './autocomplete-search-bar.component.html',
  styleUrl: './autocomplete-search-bar.component.css'
})
export class AutocompleteSearchBarComponent implements OnInit, OnDestroy {
  readonly label = input.required<string>();
  readonly noResultsText = input('No results found');
  readonly debounceDelay = input(350);
  readonly fetchOptions = input.required<
    (search?: string) => Observable<AutocompleteSearchOption[]>
  >();

  readonly searchTerm = signal('');
  readonly selectedTerm = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly options = signal<AutocompleteSearchOption[]>([]);

  readonly hasSearchValue = computed(() => this.searchTerm().trim().length > 0);

  readonly termSelected = output<string>();
  readonly optionSelected = output<AutocompleteSearchOption>();

  private activeSearchSubscription?: Subscription;

  ngOnInit(): void {
    this.fetchAndSetOptions();
  }

  onDebouncedSearch(value: string): void {
    const normalized = value.trim();

    if (normalized === this.searchTerm()) {
      return;
    }

    this.searchTerm.set(normalized);
    this.selectedTerm.set(null);
    this.fetchAndSetOptions(normalized || undefined);
  }

  onInputFocus(trigger: MatAutocompleteTrigger): void {
    if (this.options().length > 0) {
      trigger.openPanel();
      return;
    }

    this.fetchAndSetOptions(undefined, trigger);
  }

  onOptionSelected(label: string): void {
    const selected = this.options().find((option) => option.label === label);

    this.selectedTerm.set(label);
    this.searchTerm.set(label);
    this.termSelected.emit(label);

    if (selected) {
      this.optionSelected.emit(selected);
    }
  }

  ngOnDestroy(): void {
    this.activeSearchSubscription?.unsubscribe();
  }

  private fetchAndSetOptions(search?: string, trigger?: MatAutocompleteTrigger): void {
    this.activeSearchSubscription?.unsubscribe();
    this.isLoading.set(true);

    this.activeSearchSubscription = this.fetchOptions()
      (search)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des options autocomplete:', error);
          return of([]);
        })
      )
      .subscribe((options) => {
        this.options.set(options);
        this.isLoading.set(false);

        if (trigger) {
          trigger.openPanel();
        }
      });
  }
}
