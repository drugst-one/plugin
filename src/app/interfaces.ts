import {AlgorithmType, QuickAlgorithmType} from './services/analysis/analysis.service';

export interface Node {
  label: string;
  symbol: string;
  id: string;
  netexId?: string;
  uniprotAc?: string;
  ensg?: Array<string>;
  group?: string;
  groupName?: string;
  color?: string;
  shape?: string;
  interactions?: Node[];
  x?: number;
  y?: number;
  expressionLevel?: number;
}

export interface Tissue {
  netexId: number;
  name: string;
}

export interface NodeInteraction {
  from: string;
  to: string;
  group?: string;
  label?: string;
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
  return `p_${protein.id}`;
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
    from: wrappers[edge.from].nodeId,
    to: wrappers[edge.to].nodeId,
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

export function getDrugBackendId(drug: Drug) {
  return drug.netexId;
}

export function getNodeId(node: Node) {
  /**
   * Returns backend_id of Gene object
   */
   if ('netexId' in node) {
     return node['netexId']
   } else {
     return node.id
   }
}

export function getId(gene: Node) {
  /**
   * Returns the network node id based on a given gene
   */
  return `${gene.id}`;
}

export function getWrapperFromCustom(gene: Node): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  // if gene.label is undefined, set it to id
  gene.label = gene.label ? gene.label : gene.id
  return {
    id: getNodeId(gene),
    nodeId: getNodeId(gene),
    type: 'custom',
    data: gene,
  };
}

export function getWrapperFromNode(gene: Node): Wrapper {
  /**
   * Constructs wrapper interface for gene
   */
  return {
    id: getNodeId(gene),
    nodeId: getNodeId(gene),
    type: 'protein',
    data: gene,
  };
}


export function getWrapperFromDrug(drug: Drug): Wrapper {
  return {
    id: getDrugBackendId(drug),
    nodeId: getDrugNodeId(drug),
    type: 'drug',
    data: drug,
  };
}

// protein = node that exists as protein in backend
// drug = drug from backend, found in analysis
// custom = custom node from user that could not be mapped to protein
export type WrapperType = 'protein' | 'drug' | 'custom';
export type EdgeType = 'protein-protein' | 'protein-drug';

export interface Wrapper {
  id: string;
  nodeId: string;
  type: WrapperType;
  data: {
    id: string;
    label: string;
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
  status: 'approved' | 'investigational';
  inTrial: boolean;
  inLiterature: boolean;
  trialLinks: string[];
  netexId: string;
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
