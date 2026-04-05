import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { Editeur } from '../models/editeur.model';

@Injectable({
  providedIn: 'root'
})
export class EditeurService {
  private readonly endpoint = '/editeurs';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  searchByName(search?: string): Observable<Editeur[]> {
    const trimmedSearch = search?.trim();
    const params = trimmedSearch ? new HttpParams().set('search', trimmedSearch) : undefined;

    return this.http.get<Editeur[]>(this.apiConfig.getApiUrl(this.endpoint), { params });
  }
}
