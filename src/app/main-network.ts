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
    let group = customNode.group;
    if (typeof group === 'undefined' || typeof config.nodeGroups[group] === 'undefined') {
      group = 'default';
    }
    let node = JSON.parse(JSON.stringify(config.nodeGroups[group]));

    // remove group name
    delete node.name

    // node.name is actually group name since it comes from the group configuration
    // this property is already stored in the wrapper object
    // instead, node.name should reflect the actual node name
    // "node.name = customNode.name";
    // update the node with custom node properties, including values fetched from backend
    node = {
      ... node,
      ... customNode
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
    let group = customEdge.group;
    if (typeof group === 'undefined' || typeof config.edgeGroups[group] === 'undefined') {
      group = 'default';
    }
    const edge = JSON.parse(JSON.stringify(config.edgeGroups[group]));
    edge.from = customEdge.from;
    edge.to = customEdge.to;
    return edge;
  }

  public mapDataToNodes(config: IConfig): { nodes: any[], edges: any[]; } {
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
