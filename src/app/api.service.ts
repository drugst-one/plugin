import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';


const networkUrl = `${environment.backend}` + 'network/';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  async getNetwork(dataset: Array<[string, string]>) {
    const data = JSON.stringify(dataset);
    const params = new HttpParams().set('data', data);
    return this.http.get(networkUrl, {params}).toPromise();
  }

}
