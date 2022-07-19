import {AlgorithmType, QuickAlgorithmType} from './services/analysis/analysis.service';

export interface Node {
  label: string;
  symbol: Array<string>;
  id: string;
  type: string;
  drugstoneId?: Array<string> | string;
  drugstoneType: NodeType;
  drugId?: string;
  uniprotAc?: Array<string>;
  ensg?: Array<string>;
  entrez?: Array<string>;
  group?: string;
  groupName?: string;
  proteinName?: Array<string>;
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
  drugstoneId: number;
  name: string;
}

export interface NodeData {
  nodes: any;
  edges: any;
}

export type NodeType= 'protein' | 'drug' | 'disorder' | 'other'

export type NetworkType = 'explorer' | 'analysis'

export type LegendContext = 'explorer' | 'adjacentDrugs' | 'drug' | 'drugTarget' |
  'drugTargetAndSeeds' | 'drugAndSeeds' | 'adjacentDisorders' | 'adjacentDrugsAndDisorders';

/// drugstoneId to expressionlvl
export type NodeAttributeMap = { string: number } | {};

export interface NetexInteraction {
  dataset: string;
  proteinA: string;
  proteinB: string;
}

export interface NodeInteraction {
  from: string;
  to: string;
  group?: string;
  label?: string;
  title?: string;
  shadow?: boolean;
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
  return drug.drugstoneId
}

// export function getDisorderNodeId(disorder: Disorder) {
//   /**
//    * Returns backend_id of Drug object
//    */
//   return disorder.drugstoneId

export function getNodeId(node: Node) {
  /**
   * Returns backend_id of Gene object
   */
  //  if ('drugstoneId' in node) {
  //    return node['drugstoneId']
  //  } else {
  //    return node.id
  //  }
  return node.id
}

export function getNetworkId(node: Node) {
  /**
   * Returns ID of a network node
   */
  return node.drugstoneId
}

export function getId(gene: Node) {
  /**
   * Returns the network node id based on a given gene
   */
  return `${gene.id}`;
}

export function getWrapperFromNode(node: Node): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  // if node does not have property group, it was custom node from user
  node.group = node.group ? node.group : 'default';
  node.label = node.label ? node.label : node.id
  return {
    id: node.id,
    data: node,
  };
}

export type EdgeType = 'protein-protein' | 'protein-drug';

export interface Wrapper {
  id: string;
  data: {
    id: string;
    label: string;
    type?: string;
    symbol?: Array<string>;
    drugstoneId?: Array<string> |string;
    drugstoneType: NodeType,
    ensg?: Array<string>;
    entrez?: Array<string>;
    shape?: string;
    color?: string;
    interactions?: any;
    group?: string;
    groupName?: string;
    proteinName?: Array<string>;
    uniprotAc?: Array<string>;
    expressionLevel?: number;
    gradient?: number;
    x?: number;
    y?: number;
    drugId?: string;
    disorderId?: string;
    icd10?: string[];
    status?: 'approved' | 'investigational';
    inTrial?: boolean;
    inLiterature?: boolean;
    trialLinks?: string[];
    detailShowLabel?: boolean;
  };
  expression?: number;
}

export interface Drug {
  id: string;
  label: string;
  type: string;
  status: 'approved' | 'investigational';
  inTrial: boolean;
  inLiterature: boolean;
  trialLinks: string[];
  drugstoneId: string;
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
