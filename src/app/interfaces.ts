export type NodeType = 'host' | 'virus' | 'drug';

export interface Protein {
  name: string;
  proteinAc: string;
  effects?: ViralProtein[];
  x?: number;
  y?: number;
}

export interface ViralProtein {
  effectId: string;
  effectName: string;
  virusName: string;
  datasetName: string;
  proteins?: Protein[];
  x?: number;
  y?: number;
}

export interface ProteinViralInteraction {
  effectName: string;
  virusName: string;
  datasetName: string;
  proteinAc: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
}

export interface Task {
  token: string;
  info: {
    target: 'drug' | 'drug-target',
    algorithm: 'trustrank' | 'multisteiner' | 'keypathwayminer' | 'quick';
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

export function getViralProteinNodeId(viralProtein: ViralProtein) {
  return `v_${viralProtein.effectName}_${viralProtein.virusName}`;
}

export function getNodeIdsFromPVI(pvi: ProteinViralInteraction) {
  return {
    from: `p_${pvi.proteinAc}`,
    to: `v_${pvi.effectName}_${pvi.virusName}`,
  };
}

export function getNodeIdsFromPPI(edge: NetworkEdge, wrappers: {[key: string]: Wrapper}) {
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

export function getViralProteinBackendId(viralProtein: ViralProtein) {
  return viralProtein.effectId;
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

export function getWrapperFromViralProtein(viralProtein: ViralProtein): Wrapper {
  return {
    backendId: getViralProteinBackendId(viralProtein),
    nodeId: getViralProteinNodeId(viralProtein),
    type: 'virus',
    data: viralProtein,
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

export function getTypeFromNodeId(nodeId: string): WrapperType {
  if (nodeId.startsWith('p_')) {
    return 'host';
  }
  if (nodeId.startsWith('v_')) {
    return 'virus';
  }
  if (nodeId.startsWith('d_')) {
    return 'drug';
  }
}

export interface Wrapper {
  backendId: string;
  nodeId: string;
  type: 'host' | 'virus' | 'drug';
  data: any;
}

export interface Drug {
  drugId: string;
  name: string;
  status: 'approved' | 'investigational';
}
