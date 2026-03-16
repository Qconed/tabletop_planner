import { Component, signal } from '@angular/core';
import { map } from 'rxjs';
import { Editeur } from '../../../../core/models/editeur.model';
import { EditeurService } from '../../../../core/services/editeur.service';
import {
  AutocompleteSearchBarComponent,
  AutocompleteSearchOption
} from '../../../../shared/components/autocomplete-search-bar/autocomplete-search-bar.component';

@Component({
  selector: 'app-reservations',
  imports: [AutocompleteSearchBarComponent],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent {
  readonly selectedEditeurTerm = signal<string | null>(null);
  readonly selectedEditeur = signal<Editeur | null>(null);

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

  constructor(private readonly editeurService: EditeurService) { }

  onEditeurTermSelected(term: string): void {
    this.selectedEditeurTerm.set(term);
  }

  onEditeurOptionSelected(option: AutocompleteSearchOption): void {
    const editeur = option.meta as Editeur | undefined;
    this.selectedEditeur.set(editeur ?? null);
  }
}
