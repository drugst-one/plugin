import {AlgorithmType, QuickAlgorithmType} from './services/analysis/analysis.service';

export interface Node {
  label: string;
  symbol: string;
  id: string;
  type: string;
  netexId?: string;
  uniprotAc?: string;
  ensg?: Array<string>;
  group?: string;
  groupName?: string;
  color?: string | any; // mostly any, but vis js allows detail settings
  shape?: string;
  image?: string;
  interactions?: Node[];
  x?: number;
  y?: number;
  borderWidth: number;
  borderWidthSelected: number;
  opacity?: number;
  font: {
    color: string;
    size: number;
  }
}

export interface Tissue {
  netexId: number;
  name: string;
}

export type legendContext = 'explorer' | 'adjacentDrugs' | 'drug' | 'drugTarget' | 
'drugTargetAndSeeds' | 'drugAndSeeds';

/// netexId to expressionlvl
export type NodeAttributeMap = { string: number };


export interface NodeInteraction {
  from: string;
  to: string;
  group?: string;
  label?: string;
  title?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label: string;
}

export interface Task {
  token: string;
  info: {
    target: 'drug' | 'drug-target',
    algorithm: AlgorithmType | QuickAlgorithmType;
    parameters?: { [key: string]: any };

    workerId?: string;
    jobId?: string;

    progress: number;
    status: string;

    createdAt: string;
    startedAt: string;
    finishedAt: string;

    done: boolean;
    failed: boolean;
  };
  stats: {
    queuePosition: number;
    queueLength: number;
  };
}

export function getProteinNodeId(protein: Node) {
  return protein.id;
}

export function getProteinBackendId(protein: Node) {
  return protein.id;
}

export function getNodeIdsFromI(pvi: NodeInteraction) {
  return {
    from: `p_${pvi.from}`,
    to: `p_${pvi.to}`,
  };
}

export function getNodeIdsFromPPI(edge: NetworkEdge, wrappers: { [key: string]: Wrapper }) {
  return {
    from: wrappers[edge.from].id,
    to: wrappers[edge.to].id,
  };
}

export function getNodeIdsFromPDI(edge: NetworkEdge) {
  return {
    from: `${edge.from}`,
    to: `${edge.to}`,
  };
}

export function getDrugNodeId(drug: Drug) {
  /**
   * Returns backend_id of Drug object
   */
  return drug.netexId
}

export function getNodeId(node: Node) {
  /**
   * Returns backend_id of Gene object
   */
  //  if ('netexId' in node) {
  //    return node['netexId']
  //  } else {
  //    return node.id
  //  }
  return node.id
}

export function getNetworkId(node: Node) {
  /**
   * Returns ID of a network node
   */
  return node.netexId
}

export function getId(gene: Node) {
  /**
   * Returns the network node id based on a given gene
   */
  return `${gene.id}`;
}

export function getWrapperFromNode(gene: Node): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  // if node does not have property group, it was custom node from user
  gene.group = gene.group ? gene.group : 'default';
  gene.label = gene.label ? gene.label : gene.id
  return {
    id: gene.id,
    data: gene,
  };
}

export type EdgeType = 'protein-protein' | 'protein-drug';

export interface Wrapper {
  id: string;
  data: {
    id: string;
    label: string;
    type?: string;
    symbol?: string;
    netexId?: string;
    ensg?: Array<string>;
    shape?: string;
    color?: string;
    interactions?: any;
    group?: string;
    groupName?: string;
    uniprotAc?: string;
    expressionLevel?: number;
    gradient?: number;
    x?: number;
    y?: number;
    drugId?: string;
    status?: 'approved' | 'investigational';
    inTrial?: boolean;
    inLiterature?: boolean;
    trialLinks?: string[];
    detailShowLabel?: boolean;
  };
}

export interface Drug {
  id: string;
  label: string;
  type: string;
  status: 'approved' | 'investigational';
  inTrial: boolean;
  inLiterature: boolean;
  trialLinks: string[];
  netexId: string;
  group: string;
}

export interface Dataset {
  label: string;
  strains: string;
  hostTarget: string;
  method: string;
  source: Array<string> | null;
  year: number;
  datasetNames: string;
  id: string;
  data: Array<[string, string]>;
}
