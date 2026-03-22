import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { ReservationClasse } from '../models/reservation.model';

export interface ReservationClasseCreateDto {
  idReservation: number;
  idClasseTarifaire: number;
  nbTables: number;
}

export interface ReservationClasseUpdateDto {
  nbTables: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationClasseService {
  private readonly endpoint = '/reservations-classes';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getByReservationId(idReservation: number): Observable<ReservationClasse[]> {
    const params = new HttpParams().set('idReservation', idReservation.toString());

    return this.http.get<ReservationClasse[]>(this.apiConfig.getApiUrl(this.endpoint), { params });
  }

  create(payload: ReservationClasseCreateDto): Observable<ReservationClasse> {
    return this.http.post<ReservationClasse>(this.apiConfig.getApiUrl(this.endpoint), payload);
  }

  update(id: number, payload: ReservationClasseUpdateDto): Observable<ReservationClasse> {
    return this.http.put<ReservationClasse>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`), payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }
}
