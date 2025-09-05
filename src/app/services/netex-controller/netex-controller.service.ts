import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Tissue, Node, EdgeType, QuickAlgorithmType, AlgorithmType} from 'src/app/interfaces';
import {InteractionDrugProteinDB, InteractionProteinProteinDB} from 'src/app/config';
import {DrugstoneConfigService} from '../drugstone-config/drugstone-config.service';

@Injectable({
  providedIn: 'root'
})
export class NetexControllerService {


  constructor(private http: HttpClient, private drugstoneConfig: DrugstoneConfigService) {
  }

  public getBackend() {
    return this.drugstoneConfig.config.backendUrl || environment.backend;
  }

  public getLatestVersion(currentVersion:string): Promise<string> {
    return this.http.get('https://api.github.com/repos/drugst-one/plugin/tags').toPromise().then(response => {
      // @ts-ignore
      for (let i = 0; i < response.length; i++) {
        let version = response[i]['name']
        if (!version.includes('-rc') || currentVersion.includes('-rc')) {
          return version
        }
      }
    })
  }

  public async getTasks(tokens): Promise<any> {
    /**
     * returns promise of tasks status
     */
    return this.http.post<any>(`${this.getBackend()}tasks/`, {tokens: JSON.stringify(tokens)}).toPromise();
  }

  public getTaskResult(token) {
    /**
     * returns promise of task result of COMPLETED task
     */
    return this.http.get<any>(`${this.getBackend()}task_result/?token=${token}`).toPromise();
  }

  public async addEdges(network, result): Promise<any> {
    const jsonString = JSON.stringify(result);
    return this.http.post<any>(`${this.getBackend()}add_edges/`, { network: network, result: jsonString }).toPromise();
  }

  public async autofill_edges(network): Promise<any> {
    return this.http.post<any>(`${this.getBackend()}autofill_edges/`, { "network": network, "config": this.drugstoneConfig.currentConfig()}).toPromise();
  }

  public async prepareNetwork(nodes, pruning_attribute): Promise<any> {
    const payload = JSON.stringify({ nodes: nodes, pruning_attribute: pruning_attribute });
    return this.http.post(`${this.getBackend()}prepare_pruning/`, payload).toPromise();
  }

  public async pruneNetworkString(network, pruning_attribute, unique_values, pruneOrphanNodes): Promise<any> {
    const payload = JSON.stringify({ network: network, pruning_attribute: pruning_attribute, unique_values: unique_values, pruneOrphanNodes: pruneOrphanNodes });
    return this.http.post(`${this.getBackend()}prune/`, payload).toPromise();
  }

  public async pruneNetworkNumber(network, pruning_attribute, cutoff, pruningDirection, pruneOrphanNodes): Promise<any> {
    const payload = JSON.stringify({ network: network, pruning_attribute: pruning_attribute, cutoff: cutoff, pruningDirection: pruningDirection, pruneOrphanNodes: pruneOrphanNodes });
    return this.http.post(`${this.getBackend()}prune/`, payload).toPromise();
  }

  public async updateResultNetwork(token, network, cutoff = 0, pruneOrphanNodes = false): Promise<any> {
    const payload = JSON.stringify({ network: network, token: token , cutoff: cutoff, pruneOrphanNodes: pruneOrphanNodes });
    return this.http.post(`${this.getBackend()}update_result_network/`, payload, { headers: { 'Content-Type': 'application/json' } }).toPromise();
  }

  public async overlayDirectedEdges(edges, nodes_mapped_dict, drugstone_mapping ): Promise<any> {
    const payload = JSON.stringify({ "ppi_dataset": "OmniPath", "licenced": false, "edges": edges, "nodes_mapped_dict": nodes_mapped_dict, "drugstone_mapping": drugstone_mapping});
    return this.http.post(`${this.getBackend()}overlay_directed_edges/`, payload).toPromise();
  }

  public async recalculateStatistics(network, config): Promise<any> {
    const payload = JSON.stringify({ "network": network, "config": config });
    return this.http.post(`${this.getBackend()}recalculate_statistics/`, payload).toPromise();
  }

  public async mapNodes(nodes, identifier, reviewed): Promise<any> {
    /**
     * Tries to map every node to a node object in out database
     * Returns list of mapped nodes if node was found, otherwise original node to not lose information
     */
    const payload = {nodes: nodes, identifier: identifier, reviewed: reviewed};
    return this.http.post(`${this.getBackend()}map_nodes/`, payload).toPromise();
  }

  public async parseFile(file): Promise<any> {
    /**
     * parses file and returns network as JSON
     */

    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.getBackend()}upload/` + file.name, formData).toPromise();
  }

  public async applyLayout(nodes, hierachical_layout): Promise<any> {
    /**
     * Applies layout to nodes
     * Returns list of nodes with adjusted positions
     */
    const payload = { nodes: nodes, hierachical_layout: hierachical_layout };
    return this.http.post(`${this.getBackend()}apply_layout/`, payload).toPromise();
  }

  public async searchProteins(query: string, identifier: string, label: string, reviewed: boolean): Promise<any> {
    /**
     * Searches for proteins in our database
     */
    const params = new HttpParams()
      .set('query', query)
      .set('identifier', identifier)
      .set('reviewed', reviewed)
      .set('label', label);
    return this.http.get(`${this.getBackend()}search_proteins/?query=${query}`, {params}).toPromise();
  }

  public tissues(): Observable<any> {
    /**
     * Lists all available tissues with id and name
     */
    return this.http.get<Tissue[]>(`${this.getBackend()}tissues/`);
  }

  public getAlgorithmDefaults(algorithm): Promise<any> {
    return this.http.get(this.getBackend() + 'get_default_params?algorithm=' + algorithm).toPromise();
  }

  public digest_request(payload): Promise<any> {
    return this.http.post('https://api.digest-validation.net/set', payload).toPromise();
  }

  public maxTissueExpression(tissue: Tissue): Promise<any> {
    const params = new HttpParams()
      .set('tissue', tissue.drugstoneId);
    return this.http.get(this.getBackend() + 'tissue_max_expression/', {params}).toPromise();
  }

  public tissueExpressionGenes(tissue: Tissue, nodes: Node[]): Observable<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
      // slice prefix of netex id away for direct lookup in db, if node not mapped to db, replace by undefined
    const genesBackendIds = nodes.flatMap((node: Node) => node.drugstoneId ? node.drugstoneId : []).map((id: string | undefined) => id ? id.slice(1) : undefined);
    const payload = {
      tissue: tissue.drugstoneId,
      proteins: JSON.stringify(genesBackendIds)
    };
    return this.http.post(`${this.getBackend()}tissue_expression/`, payload);
  }

  public adjacentDisorders(nodes: Node[], nodeType: string, dataset: string, licenced: boolean): Promise<any> {
    const params = {dataset: dataset, licenced: licenced};
    if (nodeType === 'proteins') {
      params['proteins'] = nodes.filter((node: Node) => node.drugstoneId && node.drugstoneType === 'protein').flatMap((node: Node) => node.drugstoneId).map(id => id.slice(1));
    } else if (nodeType === 'drugs') {
      params['drugs'] = nodes.map((node: Node) => node.drugId && node.drugstoneType === 'drug' ? node.drugstoneId.slice(2) : undefined).filter(id => id != null);
    }
    return this.http.post<any>(`${this.getBackend()}adjacent_disorders/`, params).toPromise();
  }

  public adjacentDrugs(pdiDataset: InteractionDrugProteinDB, licenced: boolean, nodes: Node[], approvedDrugs: boolean = false): Promise<any> {
    /**
     * Returns the expression in the given tissue for given nodes and cancerNodes
     */
      // slice prefix of netex id away for direct lookup in db, if node not mapped to db, replace by undefined
    const genesBackendIds = nodes.filter((node: Node) => node.drugstoneId && node.drugstoneType === 'protein').flatMap(node => node.drugstoneId).map(id => id.slice(1));
    const params = {
      pdi_dataset: pdiDataset,
      proteins: genesBackendIds,
      licenced: licenced,
      approved: approvedDrugs
    };
    return this.http.post<any>(`${this.getBackend()}adjacent_drugs/`, params).toPromise();
  }


  public graphExport(graph_data: { edges: EdgeType[], nodes: Node[] }) {
    /**
     * Sends complete graph data to backend where it is written to graphml or json File.
     * The file is returned as download for the user.
     */
    return this.http.post(`${this.getBackend()}graph_export/`, graph_data, {responseType: 'text'});
  }

  public async fetchEdges(nodes: Node[], dataset: InteractionProteinProteinDB, licenced: boolean): Promise<any> {
    /**
     * Tries to map every node to a node object in out database
     * Returns list of mapped nodes if node was found, otherwise original node to not lose information
     */
    const payload = {nodes: nodes, dataset: dataset, licenced: licenced};
    return this.http.post(`${this.getBackend()}fetch_edges/`, payload).toPromise();
  }

  public sendBugreport(payload): Promise<any> {
    /**
     * Sends a bugreport to the backend
     */
    return this.http.post(`${this.getBackend()}send_bugreport/`, payload).toPromise();
  }


  public async getLicense(): Promise<any> {
    /**
     * returns promise of task status
     */
    return this.http.get(`${this.getBackend()}get_license`).toPromise();
  }

  public async getViewInfos(tokens) {
    return await this.http.post(`${this.getBackend()}view_infos`, {tokens}).toPromise();
  }

}
