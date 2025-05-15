import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface StatRow {
  id: number;
  startAt: string;
  opp_name: string;
  opp_tag: string;
  character: string;
  opp_character: string;
  stage: string;
  game_duration: string;
  result: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackendCallsService {
  

  private statsRefreshTrigger = new Subject<void>();
  statsRefresh$ = this.statsRefreshTrigger.asObservable(); 


  constructor(private http: HttpClient) {}

  /** Upload slp files */
  uploadFiles(files: File[]): Observable<{ message: string; files: any[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f, f.name));
    return this.http.post<{ message: string; files: any[] }>(
      'http://localhost:3000/api/upload',
      formData
    );
  }

  myUploadFiles(formData: FormData){
    return this.http.post('http://localhost:3000/api/upload', formData).subscribe({
      next: res => {
        this.statsRefreshTrigger.next();
        console.log('Upload success:', res);
      },
      error: err => console.error('Upload failed:', err),
    });
  }

  /** Fetch stats with optional filters */
  getStats(filters: {
    character?: string;
    stage?: string;
    opp_tag?: string;
  }): Observable<StatRow[]> {
    let params = new HttpParams();
    if (filters.character) { params = params.set('character', filters.character); }
    if (filters.stage)     { params = params.set('stage', filters.stage); }
    if (filters.opp_tag)    { params = params.set('opp_tag', filters.opp_tag); }

    return this.http.get<StatRow[]>('http://localhost:3000/api/uploads', { params });
  }

  myGetStats(): Observable<StatRow[]> {
    return this.http.get<StatRow[]>('http://localhost:3000/api/uploads');
  }

  getWinRates(groupBy: string[]): Observable<any[]> {
    let params = new HttpParams();
    if (groupBy.length) {
      params = params.set('groupBy', groupBy.join(','));
    }
    return this.http.get<any[]>('http://localhost:3000/api/winrates', { params });
  }
}
