import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NvrService } from './nvr.service';

@Injectable({
  providedIn: 'root'
})
export class RestService {
  constructor(
    private http: HttpClient,
    private nvrService: NvrService
  ) {}

  /**
   * Get montage view data for specified group
   * Matches legacy zmNinja API structure
   */
  getMontageView(groupId?: number): Observable<any> {
    const loginData = this.nvrService.getLogin();
    if (!loginData) {
      throw new Error('No login data configured');
    }

    let params = new HttpParams();
    if (groupId) {
      params = params.set('group', groupId.toString());
    }
    
    const authSession = this.nvrService.getAuthSession();
    const apiUrl = `${loginData.apiurl}/montage.json${authSession}`;

    return this.http.get(apiUrl, { params });
  }

  /**
   * Get monitor stream URL for montage display
   * Matches legacy zmNinja CGI endpoint structure: /cgi-bin/nph-zms?mode=jpeg&monitor=1
   */
  async getMonitorStreamUrl(monitorId: number, options: {
    mode?: string;
    scale?: number;
    maxfps?: number;
    buffer?: number;
  } = {}): Promise<string> {
    const scale = options.scale?.toString() || '50';
    const mode = options.mode || 'jpeg';
    
    try {
      return await this.nvrService.generateStreamUrl(monitorId.toString(), scale, mode);
    } catch (error) {
      console.error('Error generating stream URL:', error);
      throw error;
    }
  }

  /**
   * Get monitors data with optional group filtering
   * Uses existing NvrService loadMonitors method
   */
  getMonitors(groupId?: number): Observable<any> {
    return this.nvrService.loadMonitors();
  }

  /**
   * Get events data with filtering options
   * Uses existing NvrService getEvents method
   */
  getEvents(options: {
    monitorId?: number;
    limit?: number;
    page?: number;
    sort?: string;
  } = {}): Observable<any> {
    return this.nvrService.getEvents(
      options.monitorId || 0,
      options.page || 1
    );
  }
}
