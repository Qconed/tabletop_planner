import { Injectable, signal } from '@angular/core';
import { Festival } from '../models/festival.model';
import { FestivalService } from '../services/festival.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class FestivalWorkspaceStore {
  readonly festivalId = signal<number | null>(null);
  readonly festival = signal<Festival | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(
    private festivalService: FestivalService,
    private router: Router
  ) {}

  setFestivalId(id: number | null) {
    if (this.festivalId() !== id) {
      this.festivalId.set(id);
      if (id !== null) {
        this.loadFestival(id);
      } else {
        this.festival.set(null);
      }
    }
  }

  private loadFestival(id: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.festivalService.getById(id).subscribe({
      next: (data) => {
        this.festival.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load festival for workspace', err);
        this.error.set('Impossible de charger les détails du festival.');
        this.isLoading.set(false);
        this.router.navigate(['/festivals']); // Redirect back if not found
      }
    });
  }

  clear() {
    this.festivalId.set(null);
    this.festival.set(null);
    this.error.set(null);
  }
}
