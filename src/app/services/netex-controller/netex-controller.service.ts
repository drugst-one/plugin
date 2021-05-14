import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AlgorithmType, QuickAlgorithmType} from '../analysis/analysis.service';

@Injectable({
  providedIn: 'root'
})
export class NetexControllerService {

  constructor(private http: HttpClient) { }

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

  public async postTask(algorithm: QuickAlgorithmType | AlgorithmType, target, parameters, ) {
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
    const payload = {nodes: JSON.stringify(nodes), identifier: JSON.stringify(identifier)};
    return this.http.post(`${environment.backend}map_nodes/`, payload).toPromise();
  }
}
