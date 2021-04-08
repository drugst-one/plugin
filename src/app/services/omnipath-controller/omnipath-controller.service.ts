import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OmnipathControllerService {

  public omnipathdb = 'https://omnipathdb.org/';

  constructor(private http: HttpClient) {

  }

  public async getInteractions(genes): Promise<any> {
    const genesString = genes.join(',');
    const params = new HttpParams()
      .set('genesymbols', '1')  // return also gene symbols
      .set('fields', 'sources,references') // returned additional information
      .set('sources', genesString)
      .set('targets', genesString) // all interactions between all genes
      .set('source_target', 'AND'); // for interactions which source in sources 'AND'/ 'OR' target in targets
    return this.http.get<any>(`${this.omnipathdb}interactions/`, {params}).toPromise();
  }
}
