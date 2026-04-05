import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { PlacementJeu, CreatePlacementJeuDto, UpdatePlacementJeuDto } from '../models/placement-jeu.model';

@Injectable({
  providedIn: 'root'
})
export class PlacementJeuService {
  private readonly endpoint = '/placements-jeux';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getAll(query?: { idReservation?: number; idClasseTarifaire?: number }): Observable<PlacementJeu[]> {
    let params = new HttpParams();
    if (query?.idReservation) {
      params = params.set('idReservation', query.idReservation.toString());
    }
    if (query?.idClasseTarifaire) {
      params = params.set('idClasseTarifaire', query.idClasseTarifaire.toString());
    }
    return this.http.get<PlacementJeu[]>(this.apiConfig.getApiUrl(this.endpoint), { params });
  }

  getById(id: number): Observable<PlacementJeu> {
    return this.http.get<PlacementJeu>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }

  create(data: CreatePlacementJeuDto): Observable<PlacementJeu> {
    return this.http.post<PlacementJeu>(this.apiConfig.getApiUrl(this.endpoint), data);
  }

  update(id: number, data: UpdatePlacementJeuDto): Observable<PlacementJeu> {
    return this.http.put<PlacementJeu>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`), data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }
}
