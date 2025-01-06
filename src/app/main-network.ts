import { IConfig } from './config';
import { NodeInteraction, Node, NetexInteraction } from './interfaces';
import * as merge from 'lodash/fp/merge';
import { DrugstoneConfigService } from './services/drugstone-config/drugstone-config.service';

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

  public mapDataToNetworkInput(config: IConfig, drugstoneConfig: DrugstoneConfigService): { nodes: Node[], edges: any[]; } {
    const nodes = [];
    const edges = [];

    for (const protein of this.proteins) {
      nodes.push(mapCustomNode(protein, config, drugstoneConfig));
    }

    for (const edge of this.edges) {
      edges.push(mapCustomEdge(edge, config, drugstoneConfig));
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
 * @param drugstoneConfig
 * @returns
 */
export function mapCustomNode(customNode: any, config: IConfig, drugstoneConfig: DrugstoneConfigService): Node {
  let node;
  if (customNode.group === undefined) {
    // fallback to default node
    node = JSON.parse(JSON.stringify(config.nodeGroups.default));
    node.group = 'default';
  } else {
    if (config.nodeGroups[customNode.group] === undefined) {
      drugstoneConfig.groupIssue = true;
      if (!drugstoneConfig.groupIssueList.includes(customNode.group)) {
        drugstoneConfig.groupIssueList.push(customNode.group);
      }
      node = JSON.parse(JSON.stringify(config.nodeGroups.default));
      node.group = 'default';
      console.error(`Node with id ${customNode.id} has undefined node group ${customNode.group}.`);
    } else
      // copy
    {
      node = JSON.parse(JSON.stringify(config.nodeGroups[customNode.group]));
    }
  }
  // update the node with custom node properties, including values fetched from backend
  node = merge(node, customNode);
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
 * @param drugstoneConfig
 * @returns
 */
export function mapCustomEdge(customEdge: NodeInteraction, config: IConfig, drugstoneConfig: DrugstoneConfigService, isPPI: boolean = true): any {
  let edge;
  let edge2 = null;
  if (customEdge.group === undefined) {
    // fallback to default node
    if(!customEdge['isDirected']) {
      edge = JSON.parse(JSON.stringify(config.edgeGroups.default));
    } else {
      if (customEdge['isStimulation'] && customEdge['isInhibition']) {
        edge = JSON.parse(JSON.stringify(config.edgeGroups.stimulation));
        edge2 = JSON.parse(JSON.stringify(config.edgeGroups.inhibition));
      } else if (customEdge['isStimulation']) {
        edge = JSON.parse(JSON.stringify(config.edgeGroups.stimulation));
        console.log("stimulation", edge);
      } else if (customEdge['isInhibition']) {
        edge = JSON.parse(JSON.stringify(config.edgeGroups.inhibition));
      } else {
        edge = JSON.parse(JSON.stringify(config.edgeGroups.neutral));
      }
    }
  } else {
    if (config.edgeGroups[customEdge.group] === undefined) {
      drugstoneConfig.groupIssue = true;
      if (!drugstoneConfig.groupIssueList.includes(customEdge.group)) {
        drugstoneConfig.groupIssueList.push(customEdge.group);
      }
      edge = JSON.parse(JSON.stringify(config.edgeGroups.default));
      console.error(`Edge "from ${customEdge.from}" - "to ${customEdge.to}" has undefined edge group ${customEdge.group}.`);
    } else
      // copy
    {
      edge = JSON.parse(JSON.stringify(config.edgeGroups[customEdge.group]));
    }
  } 
  const edges = [];
  edge = {
    ...edge,
    ...customEdge
  };
  if (!isPPI) {
    return edge;
  }
  edges.push(edge);
  if (edge2) {
    edge2 = {
      ...edge2,
      ...customEdge
    };
    delete edge2['id'];
    edge2['smooth'] = {
      enabled: true,
      type: 'curvedCCW',
      roundness: 0.2
    };
    edges.push(edge2);
  }
  return edges;
}

/** Maps netex retrieved edge to network edge object
 * Uses the default group for edge objects.
 *
 * @param customEdge
 * @param config
 * @returns
 */
export function mapNetexEdge(customEdge: NetexInteraction, config: IConfig, node_map: object): any {
  const edges = [];
  node_map[customEdge['proteinA']].forEach(from => {
    node_map[customEdge['proteinB']].forEach(to => {
      let edge;
      let edge2 = null;

      if (!customEdge['isDirected']) {
        edge = JSON.parse(JSON.stringify(config.edgeGroups.default));
      } else {
        if (customEdge['isStimulation'] && customEdge['isInhibition']) {
          edge = JSON.parse(JSON.stringify(config.edgeGroups.stimulation));
          edge2 = JSON.parse(JSON.stringify(config.edgeGroups.inhibition));
        } else if (customEdge['isStimulation']) {
          edge = JSON.parse(JSON.stringify(config.edgeGroups.stimulation));
        } else if (customEdge['isInhibition']) {
          edge = JSON.parse(JSON.stringify(config.edgeGroups.inhibition));
        } else {
          edge = JSON.parse(JSON.stringify(config.edgeGroups.neutral));
        }
      }

      edge['from'] = from;
      edge['to'] = to;
      edge['dataset'] = customEdge['dataset'];
      edges.push(edge);

      if (edge2) {
        edge2['from'] = from;
        edge2['to'] = to;
        edge2['dataset'] = customEdge['dataset'];
        edges.push(edge2);
        edge2['smooth'] = {
          enabled: true,
          type: 'curvedCCW',
          roundness: 0.2
        };
      }
    });
  });
  return edges;
}
