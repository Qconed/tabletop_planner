import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { Jeu } from '../models/jeu.model';

@Injectable({
  providedIn: 'root'
})
export class JeuService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ApiConfigService);

  private get apiUrl(): string {
    return this.config.getApiUrl('/jeux');
  }

  getAll(params?: { idEditeur?: number; search?: string }): Observable<Jeu[]> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.idEditeur) {
        httpParams = httpParams.set('idEditeur', params.idEditeur.toString());
      }
      if (params.search) {
        httpParams = httpParams.set('search', params.search.trim());
      }
    }
    return this.http.get<Jeu[]>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<Jeu> {
    return this.http.get<Jeu>(`${this.apiUrl}/${id}`);
  }

  searchByName(term?: string): Observable<Jeu[]> {
    const trimmed = term?.trim();
    if (!trimmed) {
      return this.getAll();
    }
    return this.getAll({ search: trimmed });
  }
}
