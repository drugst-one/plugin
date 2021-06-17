import {AlgorithmType, QuickAlgorithmType} from './services/analysis/analysis.service';

export interface Node {
  name: string;
  id: string;
  netexId?: string;
  uniprotAc?: string;
  group?: string;
  color?: string;
  shape?: string;
  interactions?: Node[];
  x?: number;
  y?: number;
  expressionLevel?: number;
  label?: string;
}

export interface Tissue {
  netexId: number;
  name: string;
}

export interface NodeInteraction {
  from: string;
  to: string;
  group?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
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

export type WrapperType = 'protein' | 'drug';
export type EdgeType = 'protein-protein' | 'protein-drug';

export interface Wrapper {
  id: string;
  nodeId: string;
  type: WrapperType;
  data: {
    id: string;
    name: string;
    netexId?: string;
    shape?: string;
    color?: string;
    interactions?: any;
    group?: string;
    uniprotAc?: string;
    label?: string;
    expressionLevel?: number;
    x?: number;
    y?: number;
    drugId?: string;
    status?: 'approved' | 'investigational';
    inTrial?: boolean;
    inLiterature?: boolean;
    trialLinks?: string[];
  };
}

export interface Drug {
  id: string;
  name: string;
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
