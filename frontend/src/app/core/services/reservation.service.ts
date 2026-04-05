import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { Reservation, ReservationCreateDto, ReservationUpdateDto, StatutWorkflow } from '../models/reservation.model';

interface ReservationQuery {
  idFestival?: number;
  idEditeur?: number;
  statut?: StatutWorkflow;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly endpoint = '/reservations';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getAll(query?: ReservationQuery): Observable<Reservation[]> {
    let params = new HttpParams();

    if (query?.idFestival !== undefined) {
      params = params.set('idFestival', query.idFestival.toString());
    }

    if (query?.idEditeur !== undefined) {
      params = params.set('idEditeur', query.idEditeur.toString());
    }

    if (query?.statut !== undefined) {
      params = params.set('statut', query.statut);
    }

    return this.http.get<Reservation[]>(this.apiConfig.getApiUrl(this.endpoint), {
      params,
    });
  }

  getById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }

  create(reservation: ReservationCreateDto): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiConfig.getApiUrl(this.endpoint), reservation);
  }

  update(id: number, reservation: ReservationUpdateDto): Observable<Reservation> {
    return this.http.put<Reservation>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`), reservation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }
}
