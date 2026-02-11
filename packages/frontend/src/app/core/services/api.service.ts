import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private formatErrors(error: any): Observable<never> {
    // In a real app, we might send this to Sentry or similar
    return throwError(() => error);
  }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params }).pipe(catchError(this.formatErrors));
  }

  put<T>(path: string, body: Object = {}): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}${path}`, JSON.stringify(body), {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(catchError(this.formatErrors));
  }

  patch<T>(path: string, body: Object = {}): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}${path}`, JSON.stringify(body), {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(catchError(this.formatErrors));
  }

  post<T>(path: string, body: Object = {}): Observable<T> {
    return this.http
      .post<T>(`${this.apiUrl}${path}`, JSON.stringify(body), {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      })
      .pipe(catchError(this.formatErrors));
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, formData).pipe(catchError(this.formatErrors));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`).pipe(catchError(this.formatErrors));
  }

  downloadFile(path: string, body: Object = {}): Observable<Blob> {
    return this.http
      .post(`${this.apiUrl}${path}`, JSON.stringify(body), {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        responseType: 'blob',
      })
      .pipe(catchError(this.formatErrors));
  }
}
