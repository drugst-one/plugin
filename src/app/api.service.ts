import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';


const networkUrl = `${environment.backend}` + 'network/';
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  async getNetwork() {
    return this.http.get(networkUrl).toPromise();
  }

}
