import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Tissue, Node, EdgeType, QuickAlgorithmType, AlgorithmType} from 'src/app/interfaces';
import {InteractionDrugProteinDB, InteractionProteinProteinDB} from 'src/app/config';

@Injectable({
  providedIn: 'root'
})
export class NetexControllerService {

  constructor(private http: HttpClient) {
  }

  public async getTasks(tokens): Promise<any> {
    /**
     * returns promise of tasks status
     */
    return this.http.post<any>(`${environment.backend}tasks/`, {tokens: JSON.stringify(tokens)}).toPromise();
  }

  public getTaskResult(token) {
    /**
     * returns promise of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}`).toPromise();
  }

  public async mapNodes(nodes, identifier): Promise<any> {
    /**
     * Tries to map every node to a node object in out database
     * Returns list of mapped nodes if node was found, otherwise original node to not lose information
     */
    const payload = {nodes: nodes, identifier: identifier};
    return this.http.post(`${environment.backend}map_nodes/`, payload).toPromise();
  }

  public tissues(): Observable<any> {
    /**
     * Lists all available tissues with id and name
     */
    return this.http.get<Tissue[]>(`${environment.backend}tissues/`);
  }

  public tissueExpressionGenes(tissue: Tissue, nodes: Node[]): Observable<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
      // slice prefix of netex id away for direct lookup in db, if node not mapped to db, replace by undefined
    const genesBackendIds = nodes.flatMap((node: Node) => node.drugstoneId ? node.drugstoneId : []).map((id: string | undefined) => id ? id.slice(1) : undefined);
    const params = new HttpParams()
      .set('tissue', tissue.drugstoneId)
      .set('proteins', JSON.stringify(genesBackendIds));
    return this.http.get(`${environment.backend}tissue_expression/`, {params});
  }

  public adjacentDisorders(nodes: Node[], nodeType: string, dataset: string, licenced: boolean): Observable<any> {
    const params = {dataset: dataset, licenced: licenced};
    if (nodeType === 'proteins') {
      params["proteins"] = nodes.filter((node: Node) => node.drugstoneId && node.drugstoneType === 'protein').flatMap((node: Node) => node.drugstoneId).map(id => id.slice(1));
    } else if (nodeType === 'drugs') {
      params["drugs"] = nodes.map((node: Node) => node.drugId && node.drugstoneType === 'drug' ? node.drugstoneId.slice(2) : undefined).filter(id => id != null);
    }
    return this.http.post<any>(`${environment.backend}adjacent_disorders/`, params);
  }

  public adjacentDrugs(pdiDataset: InteractionDrugProteinDB, licenced: boolean, nodes: Node[]): Observable<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
      // slice prefix of netex id away for direct lookup in db, if node not mapped to db, replace by undefined
    const genesBackendIds = nodes.filter((node: Node) => node.drugstoneId && node.drugstoneType === 'protein').flatMap(node => node.drugstoneId).map(id => id.slice(1));
    const params = {
      pdi_dataset: pdiDataset,
      proteins: genesBackendIds,
      licenced: licenced
    };
    return this.http.post<any>(`${environment.backend}adjacent_drugs/`, params);
  }

  public graphExport(graph_data: { edges: EdgeType[], nodes: Node[] }) {
    /**
     * Sends complete graph data to backend where it is written to graphml or json File.
     * The file is returned as download for the user.
     */
    return this.http.post(`${environment.backend}graph_export/`, graph_data, {responseType: 'text'});
  }

  public async fetchEdges(nodes: Node[], dataset: InteractionProteinProteinDB, licenced: boolean): Promise<any> {
    /**
     * Tries to map every node to a node object in out database
     * Returns list of mapped nodes if node was found, otherwise original node to not lose information
     */
    const payload = {nodes: nodes, dataset: dataset, licenced: licenced};
    return this.http.post(`${environment.backend}fetch_edges/`, payload).toPromise();
  }


  public async getLicense(): Promise<any> {
    /**
     * returns promise of task status
     */
    return this.http.get(`${environment.backend}get_license`).toPromise();
  }
}
