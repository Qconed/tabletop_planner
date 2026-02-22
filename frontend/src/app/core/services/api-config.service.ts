import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseApi = environment.baseApi;

  constructor() {}

  /**
   * Get the full API URL by appending the endpoint to the base API URL
   * @param endpoint - The API endpoint (e.g., '/auth', '/users', '/games')
   * @returns The complete API URL
   */
  getApiUrl(endpoint: string): string {
    // Ensure endpoint starts with a forward slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseApi}${normalizedEndpoint}`;
  }

  /**
   * Get the base API URL
   * @returns The base API URL
   */
  getBaseApi(): string {
    return this.baseApi;
  }
}