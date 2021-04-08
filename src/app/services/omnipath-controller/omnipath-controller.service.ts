import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OmnipathControllerService {

  public omnipathdb = 'https://omnipathdb.org/';

  constructor(private http: HttpClient) {

  }

  public async getInteractions(genes): Promise<any> {
    const genesStringified = JSON.stringify(genes);
    const params = new HttpParams()
      .set('genesymbols', '1')  // return also gene symbols
      .set('fields', 'sources,references') // returned additional information
      .set('sources', JSON.stringify(genesStringified))
      .set('targets', JSON.stringify(genesStringified)) // all interactions between all genes
      .set('source_target', 'AND'); // for interactions which source in sources 'AND'/ 'OR' target in targets

    return this.http.get<any>(`${this.omnipathdb}interactions/`, {params}).toPromise();
  }
}
