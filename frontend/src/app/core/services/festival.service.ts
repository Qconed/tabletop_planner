import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { Festival, FestivalCreateDto, FestivalUpdateDto } from '../models/festival.model';

@Injectable({
  providedIn: 'root'
})
export class FestivalService {
  private readonly endpoint = '/festivals';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getAll(): Observable<Festival[]> {
    return this.http.get<Festival[]>(this.apiConfig.getApiUrl(this.endpoint));
  }

  getById(id: number): Observable<Festival> {
    return this.http.get<Festival>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }

  create(festival: FestivalCreateDto): Observable<Festival> {
    return this.http.post<Festival>(this.apiConfig.getApiUrl(this.endpoint), festival);
  }

  update(id: number, festival: FestivalUpdateDto): Observable<Festival> {
    return this.http.put<Festival>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`), festival);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }
}
