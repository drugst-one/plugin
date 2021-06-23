import {HttpClient} from '@angular/common/http';
import { IConfig } from './config';
import {NodeInteraction, Node, getProteinNodeId} from './interfaces';

export function getDatasetFilename(dataset: Array<[string, string]>): string {
  return `network-${JSON.stringify(dataset).replace(/[\[\]\",]/g, '')}.json`;
}

export class ProteinNetwork {

  constructor(public proteins: Node[], public edges: NodeInteraction[]) {
  }

  public async loadPositions(http: HttpClient, dataset: Array<[string, string]>) {
    const nodePositions = await http.get(`assets/positions/${getDatasetFilename(dataset)}`).toPromise();
    this.proteins.forEach((node) => {
      const nodePosition = nodePositions[getProteinNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProtein(ac: string): Node | undefined {
    return this.proteins.find((p) => p.id === ac);
  }

  public linkNodes() {
    this.proteins.forEach((pg) => {
      pg.interactions = [];
    });
    this.edges.forEach((edge) => {
      const protein1 = this.getProtein(edge.from);
      const protein2 = this.getProtein(edge.to);
      if (protein1 && protein2) {
        protein1.interactions.push(protein2);
        protein2.interactions.push(protein1);
      }
    });
  }

  /** Maps user input node to network node object
   * 
   * @param customNode 
   * @param config 
   * @returns 
   */
  private mapCustomNode(customNode: any, config: IConfig): Node {
    
    if (config.nodeGroups[customNode.group] === undefined) {
      throw `Node with id ${customNode.id} has undefined node group ${customNode.group}.`
    }

    let node = JSON.parse(JSON.stringify(config.nodeGroups[customNode.group]));

    // update the node with custom node properties, including values fetched from backend
    node = {
      ...node,
      ...customNode
    }

    // label is only used for network visualization
    node.label = customNode.label ? customNode.label : customNode.id;

    if (node.image) {
      node.shape = 'image';
    }
    
    return node;
  }

  /** Maps user input edge to network edge object
   * 
   * @param customEdge 
   * @param config 
   * @returns 
   */
  private mapCustomEdge(customEdge: NodeInteraction, config: IConfig): any {

    if (config.edgeGroups[customEdge.group] === undefined) {
      throw `Edge "from ${customEdge.from}" - "to ${customEdge.to}" has undefined edge group ${customEdge.group}.`
    }

    let edge = JSON.parse(JSON.stringify(config.edgeGroups[customEdge.group]));

    edge = {
      ...edge,
      ...customEdge
    }
    return edge;
  }

  public mapDataToNetworkInput(config: IConfig): { nodes: any[], edges: any[]; } {
    const nodes = [];
    const edges = [];

    for (const protein of this.proteins) {
      nodes.push(this.mapCustomNode(protein, config));
    }

    for (const edge of this.edges) {
      edges.push(this.mapCustomEdge(edge, config));
    }

    return {
      nodes,
      edges,
    };
  }

}
