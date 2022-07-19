import {defaultConfig, IConfig} from './config';
import {NodeInteraction, Node, getProteinNodeId, NetexInteraction} from './interfaces';
import * as merge from 'lodash/fp/merge';

export function getDatasetFilename(dataset: Array<[string, string]>): string {
  return `network-${JSON.stringify(dataset).replace(/[\[\]\",]/g, '')}.json`;
}

export class ProteinNetwork {

  constructor(public proteins: Node[], public edges: NodeInteraction[]) {
  }

  public updateNodePositions(positions) {
    this.proteins.forEach((node) => {
      // take old node position if it is saved. it might only not be saved if node did not exist in old network
      if (!(node.id in positions)) {
        return;
      }
      const nodePosition = positions[node.id];
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

  public mapDataToNetworkInput(config: IConfig): { nodes: Node[], edges: any[]; } {
    const nodes = [];
    const edges = [];

    for (const protein of this.proteins) {
      nodes.push(mapCustomNode(protein, config));
    }

    for (const edge of this.edges) {
      edges.push(mapCustomEdge(edge, config));
    }

    return {
      nodes,
      edges,
    };
  }

}

/** Maps user input node to network node object
 * If user input node has no group, fall back to default
 * If user input node has group that is not defined, throw error
 *
 * @param customNode
 * @param config
 * @returns
 */
export function mapCustomNode(customNode: any, config: IConfig): Node {
  let node;
  if (customNode.group === undefined) {
    // fallback to default node
    node = JSON.parse(JSON.stringify(config.nodeGroups.default));
    node.group = 'default';
  } else {
    if (config.nodeGroups[customNode.group] === undefined) {
      throw `Node with id ${customNode.id} has undefined node group ${customNode.group}.`
    }
    // copy
    node = JSON.parse(JSON.stringify(config.nodeGroups[customNode.group]));
  }
  // update the node with custom node properties, including values fetched from backend
  node = merge(node, customNode)
  // label is only used for network visualization
  node.label = customNode.label ? customNode.label : customNode.id;
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
export function mapCustomEdge(customEdge: NodeInteraction, config: IConfig): any {
  let edge;
  if (customEdge.group === undefined) {
    // fallback to default node
    edge = JSON.parse(JSON.stringify(config.edgeGroups.default));
  } else {
    if (config.edgeGroups[customEdge.group] === undefined) {
      console.error(`Edge "from ${customEdge.from}" - "to ${customEdge.to}" has undefined edge group ${customEdge.group}.`);
    }
    // copy
    edge = JSON.parse(JSON.stringify(config.edgeGroups[customEdge.group]));
  }
  edge = {
    ...edge,
    ...customEdge
  };
  return edge;
}

/** Maps netex retrieved edge to network edge object
 * Uses the default group for edge objects.
 *
 * @param customEdge
 * @param config
 * @returns
 */
export function mapNetexEdge(customEdge: NetexInteraction, config: IConfig, node_map: object): any {
  const edge = JSON.parse(JSON.stringify(config.edgeGroups.default));
  edge['from'] = node_map[customEdge['proteinA']];
  edge['to'] = node_map[customEdge['proteinB']];
  edge['dataset'] = customEdge['dataset'];
  return edge;
}
