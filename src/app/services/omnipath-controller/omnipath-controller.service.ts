import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OmnipathControllerService {

  public omnipathdb = 'https://omnipathdb.org/';

  constructor(private http: HttpClient) {

  }

  private processOmnipathInteractionData(rawData: string, identifier, nameToNetworkId) {
    /**
     * Converts the returned tsv-like data from omnipath into interaction-data for the network
     */
    // split the lines
    const lines = rawData.split('\n');
    // remove header
    lines.shift();
    // split the rows and read the interactions
    const interactions = [];
    lines.forEach((line) => {
      // skip empty strings
      if (line === '') {
          return;
      }
      const lineValues = line.split('\t');
      let source;
      let target;
      if (identifier === 'uniprot') {
        // entry 1 is always source uniprot ID, entry 2 always target uniprot ID
        source =  lineValues[0];
        target = lineValues[1];
      } else if (identifier === 'hugo') {
        // entry 3 is always source name, entry 4 always target name
        source =  lineValues[2];
        target = lineValues[3];
      }
      interactions.push({from: nameToNetworkId[source], to: nameToNetworkId[target]});
    });
    return interactions;
  }

  public async getInteractions(genes, identifier, nameToNetworkId) {
    /**
     * The Omnipath API returns a confusing HttpErrorResponse but also a status code 200.
     * Anyway, the queried data can be found also in the error text
     * thus, errors are also catched and their text is returned as valid return value
     */
    const genesString = genes.join(',');
    const params = new HttpParams()
      .set('genesymbols', '1')  // return also gene symbols
      .set('fields', 'sources,references') // returned additional information
      .set('sources', genesString)
      .set('targets', genesString) // all interactions between all genes
      .set('source_target', 'AND'); // for interactions which source in sources 'AND'/ 'OR' target in targets
    let res = null;
    await this.http.get<any>(`${this.omnipathdb}interactions/`, {params}).toPromise()
      .then((data) => res = this.processOmnipathInteractionData(data.text, identifier, nameToNetworkId))
      .catch((error) => res = this.processOmnipathInteractionData(error.error.text, identifier, nameToNetworkId));

    return res;
  }
}
