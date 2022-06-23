import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AlgorithmType, QuickAlgorithmType} from '../analysis/analysis.service';
import {Observable} from 'rxjs';
import {Tissue, Node, EdgeType} from 'src/app/interfaces';
import {InteractionDrugProteinDB, InteractionProteinProteinDB} from 'src/app/config';

@Injectable({
  providedIn: 'root'
})
export class NetexControllerService {

  constructor(private http: HttpClient) {
  }

  public async getTask(token): Promise<any> {
    /**
     * returns promise of task status
     */
    return this.http.get(`${environment.backend}task/?tokens=${token}`).toPromise();
  }

  public async getTasks(tokens): Promise<any> {
    /**
     * returns promise of tasks status
     */
    return this.http.post<any>(`${environment.backend}tasks/`, {tokens: JSON.stringify(tokens)}).toPromise();
  }

  public async getTaskResult(token): Promise<any> {
    /**
     * returns promise of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}`).toPromise();
  }

  public async getTaskResultDrug(token): Promise<any> {
    /**
     * returns promise of drug view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=drugs`).toPromise();
  }

  public async getTaskResultGene(token): Promise<any> {
    /**
     * returns promise of gene view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=genes`).toPromise();
  }

  public async getTaskResultCancerNode(token): Promise<any> {
    /**
     * returns promise of cancer driver gene view of task result of COMPLETED task
     */
    return this.http.get<any>(`${environment.backend}task_result/?token=${token}&view=cancer_driver_genes`).toPromise();
  }

  public async postTask(algorithm: QuickAlgorithmType | AlgorithmType, target, parameters,) {
    /**
     * sends a task to task service
     */

    return this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();
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
    const genesBackendIds = nodes.map((node: Node) => node.drugstoneId ? node.drugstoneId.slice(1) : undefined);
    const params = new HttpParams()
      .set('tissue', tissue.drugstoneId)
      .set('proteins', JSON.stringify(genesBackendIds));
    return this.http.get(`${environment.backend}tissue_expression/`, {params});
  }

  public adjacentDisorders(nodes: Node[], nodeType: string): Observable<any> {

    const params = {};
    if (nodeType === 'proteins') {
      // @ts-ignore
      params.proteins = nodes.map((node: Node) => node.drugstoneId && node.drugstoneId.startsWith('p') ? node.drugstoneId.slice(1) : undefined).filter(id => id != null);
    } else if (nodeType === 'drugs') {
      // @ts-ignore
      params.drugs = nodes.map((node: Node) => node.drugId && node.drugstoneId.startsWith('dr') ? node.drugstoneId.slice(2) : undefined).filter(id => id != null);
    }
    return this.http.post<any>(`${environment.backend}adjacent_disorders/`, params);
  }

  public adjacentDrugs(pdiDataset: InteractionDrugProteinDB, nodes: Node[]): Observable<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
      // slice prefix of netex id away for direct lookup in db, if node not mapped to db, replace by undefined
    const genesBackendIds = nodes.map((node: Node) => node.drugstoneId && node.drugstoneId.startsWith('p') ? node.drugstoneId.slice(1) : undefined).filter(id => id != null);
    const params = {
      pdi_dataset: pdiDataset,
      proteins: genesBackendIds
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

  public async fetchEdges(nodes: Node[], dataset: InteractionProteinProteinDB): Promise<any> {
    /**
     * Tries to map every node to a node object in out database
     * Returns list of mapped nodes if node was found, otherwise original node to not lose information
     */
    const payload = {nodes: nodes, dataset: dataset};
    return this.http.post(`${environment.backend}fetch_edges/`, payload).toPromise();
  }
}
