import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { ClasseTarifaire, ClasseTarifaireCreateDto, ClasseTarifaireUpdateDto } from '../models/classe-tarifaire.model';

@Injectable({
  providedIn: 'root'
})
export class ClasseTarifaireService {
  private readonly endpoint = '/classes-tarifaires';

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getAll(): Observable<ClasseTarifaire[]> {
    return this.http.get<ClasseTarifaire[]>(this.apiConfig.getApiUrl(this.endpoint));
  }

  getById(id: number): Observable<ClasseTarifaire> {
    return this.http.get<ClasseTarifaire>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }

  getByFestival(festivalId: number): Observable<ClasseTarifaire[]> {
    return this.http.get<ClasseTarifaire[]>(
      this.apiConfig.getApiUrl(`${this.endpoint}?idFestival=${festivalId}`)
    );
  }

  create(classeTarifaire: ClasseTarifaireCreateDto): Observable<ClasseTarifaire> {
    return this.http.post<ClasseTarifaire>(this.apiConfig.getApiUrl(this.endpoint), classeTarifaire);
  }

  update(id: number, classeTarifaire: ClasseTarifaireUpdateDto): Observable<ClasseTarifaire> {
    return this.http.put<ClasseTarifaire>(
      this.apiConfig.getApiUrl(`${this.endpoint}/${id}`),
      classeTarifaire
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(this.apiConfig.getApiUrl(`${this.endpoint}/${id}`));
  }
}
