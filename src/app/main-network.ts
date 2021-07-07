import {HttpClient} from '@angular/common/http';
import { defaultConfig, IConfig } from './config';
import {NodeInteraction, Node, getProteinNodeId} from './interfaces';

export function getDatasetFilename(dataset: Array<[string, string]>): string {
  return `network-${JSON.stringify(dataset).replace(/[\[\]\",]/g, '')}.json`;
}

export class ProteinNetwork {

  constructor(public proteins: Node[], public edges: NodeInteraction[]) {
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
   * If user input node has no group, fall back to default
   * If user input node has group that is not defined, throw error
   * 
   * @param customNode 
   * @param config 
   * @returns 
   */
  private mapCustomNode(customNode: any, config: IConfig): Node {
    let node;
    if (customNode.group === undefined) {
      // fallback to default node
      node = JSON.parse(JSON.stringify(defaultConfig.nodeGroups.default));
      node.group = 'default'
    } else {
      if (config.nodeGroups[customNode.group] === undefined) {
        throw `Node with id ${customNode.id} has undefined node group ${customNode.group}.`
      }
      // copy
      node = JSON.parse(JSON.stringify(config.nodeGroups[customNode.group]));
    }
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
    // // remove '_' from group if group is defined
    // node.group = node.group===undefined ? node.group : node.group.replace('_', '');
    return node;
  }

  /** Maps user input edge to network edge object
   * If user input edge has no group, fall back to default
   * If user input edge has group that is not defined, throw error
   * 
   * @param customEdge 
   * @param config 
   * @returns 
   */
  private mapCustomEdge(customEdge: NodeInteraction, config: IConfig): any {
    let edge;
    if (customEdge.group === undefined) {
      // fallback to default node
      edge = JSON.parse(JSON.stringify(defaultConfig.edgeGroups.default));
    } else {
      if (config.edgeGroups[customEdge.group] === undefined) {
        throw `Edge "from ${customEdge.from}" - "to ${customEdge.to}" has undefined edge group ${customEdge.group}.`
      }
      // copy
      edge = JSON.parse(JSON.stringify(config.edgeGroups[customEdge.group]));
    }
    edge = {
      ...edge,
      ...customEdge
    }
    // // remove '_' from group if group is defined
    // edge.group = edge.group===undefined ? edge.group : edge.group.replace('_', '');
    return edge;
  }

  public mapDataToNetworkInput(config: IConfig): { nodes: Node[], edges: any[]; } {
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
