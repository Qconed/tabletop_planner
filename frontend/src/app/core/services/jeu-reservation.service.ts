import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { JeuReservation, CreateJeuReservationDto, UpdateJeuReservationDto } from '../models/jeu-reservation.model';

@Injectable({
  providedIn: 'root'
})
export class JeuReservationService {
  private readonly endpoint = '/jeux-reservations';

  constructor(
    private http: HttpClient,
    private apiConfigService: ApiConfigService
  ) {}

  getAll(idReservation?: number): Observable<JeuReservation[]> {
    let params = new HttpParams();
    if (idReservation) {
      params = params.set('idReservation', idReservation.toString());
    }
    return this.http.get<JeuReservation[]>(this.apiConfigService.getApiUrl(this.endpoint), { params });
  }

  getById(idReservation: number, idJeu: number): Observable<JeuReservation> {
    return this.http.get<JeuReservation>(this.apiConfigService.getApiUrl(`${this.endpoint}/${idReservation}/${idJeu}`));
  }

  create(data: CreateJeuReservationDto): Observable<JeuReservation> {
    return this.http.post<JeuReservation>(this.apiConfigService.getApiUrl(this.endpoint), data);
  }

  update(idReservation: number, idJeu: number, data: UpdateJeuReservationDto): Observable<JeuReservation> {
    return this.http.put<JeuReservation>(this.apiConfigService.getApiUrl(`${this.endpoint}/${idReservation}/${idJeu}`), data);
  }

  delete(idReservation: number, idJeu: number): Observable<void> {
    return this.http.delete<void>(this.apiConfigService.getApiUrl(`${this.endpoint}/${idReservation}/${idJeu}`));
  }
}
