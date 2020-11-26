import {AlgorithmType, QuickAlgorithmType} from './analysis.service';

export interface Protein {
  name: string;
  proteinAc: string;
  proteinName: string;
  interactions?: Protein[];
  x?: number;
  y?: number;
  expressionLevel?: number;
}

export interface Tissue {
  id: number;
  name: string;
}

export interface ProteinProteinInteraction {
  from: string;
  to: string;
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

export function getProteinNodeId(protein: Protein) {
  return `p_${protein.proteinAc}`;
}

export function getProteinBackendId(protein: Protein) {
  return protein.proteinAc;
}

export function getNodeIdsFromI(pvi: ProteinProteinInteraction) {
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
    from: `p_${edge.from}`,
    to: `d_${edge.to}`,
  };
}

export function getDrugNodeId(drug: Drug) {
  return `d_${drug.drugId}`;
}

export function getDrugBackendId(drug: Drug) {
  return drug.drugId;
}

export function getWrapperFromProtein(protein: Protein): Wrapper {
  return {
    backendId: getProteinBackendId(protein),
    nodeId: getProteinNodeId(protein),
    type: 'host',
    data: protein,
  };
}

export function getWrapperFromDrug(drug: Drug): Wrapper {
  return {
    backendId: getDrugBackendId(drug),
    nodeId: getDrugNodeId(drug),
    type: 'drug',
    data: drug,
  };
}

export type WrapperType = 'host' | 'virus' | 'drug';

export interface Wrapper {
  backendId: string;
  nodeId: string;
  type: WrapperType;
  data: any;
}

export interface Drug {
  drugId: string;
  name: string;
  status: 'approved' | 'investigational';
  inTrial: boolean;
  inLiterature: boolean;
  trialLinks: string[];
}

export interface Dataset {
  label: string;
  strains: string;
  hostTarget: string;
  method: string;
  source: Array<string> | null;
  year: number;
  datasetNames: string;
  backendId: string;
  data: Array<[string, string]>;
}
