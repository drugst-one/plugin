export interface Node {
  ctxRenderer?: any;
  label: string;
  symbol: Array<string>;
  id: string;
  type: string;
  drugstoneId?: Array<string> | string;
  drugstoneType: NodeType;
  drugId?: string;
  uniprot?: Array<string>;
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
  state?: { hover: boolean, selected: boolean };
  borderWidth: number;
  borderWidthSelected: number;
  opacity?: number;
  shadow?: any;
  rank?: number;
  score?: number;
  properties?: any;
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

export interface NetworkData {
  nodes: any[],
  edges: NetworkEdge[]
}

export type NodeType = 'protein' | 'drug' | 'disorder' | 'other'

export type NetworkType = 'explorer' | 'analysis'

export type LegendContext = 'explorer' | 'adjacentDrugs' | 'drug' | 'drugTarget' | 'seeds' | 'adjacentDisorders' | 'pathway' | 'louvain' | 'firstNeighbor';

/// drugstoneId to expressionlvl
export type NodeAttributeMap = { string: number } | {};

export interface NetexInteraction {
  dataset: string;
  proteinA: string;
  proteinB: string;
  isDirected: boolean;
  isStimulation: boolean;
  isInhibition: boolean;
}

export interface NodeInteraction {
  from: string;
  to: string;
  group?: string;
  groupName?: string;
  label?: string;
  title?: string;
  shadow?: boolean;
  // custom attributes by user
  // [key: string]: string | number | boolean;
}

export interface NetworkEdge {
  from: string;
  to: string;
  label: string;
}

export type AlgorithmTarget = 'drug' | 'drug-target' | 'gene' | 'clustering'

export interface Task {
  token: string;
  info: {
    target: AlgorithmTarget,
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

export function getNodeFromWrapper(wrapper: Wrapper): Node {
  wrapper.data['properties'] = wrapper.data['properties'] ? wrapper.data['properties'] : {};
  wrapper.data['properties']['score'] = wrapper.data["score"];
  wrapper.data['properties']['rank'] = wrapper.data["rank"];
  const node = {
    label: wrapper.data.label,
    symbol: wrapper.data.symbol,
    id: wrapper.data.id,
    type: wrapper.data.type,
    drugstoneId: wrapper.data.drugstoneId,
    drugstoneType: wrapper.data.drugstoneType,
    drugId: wrapper.data.drugId,
    uniprot: wrapper.data.uniprot,
    ensg: wrapper.data.ensg,
    entrez: wrapper.data.entrez,
    group: wrapper.data._group,
    groupName: wrapper.data.groupName,
    proteinName: wrapper.data.proteinName,
    color: wrapper.data.color,
    shape: wrapper.data.shape,
    interactions: wrapper.data.interactions,
    x: wrapper.data.x,
    y: wrapper.data.y,
    borderWidth: wrapper.data["borderWidth"],
    borderWidthSelected: wrapper.data["borderWidthSelected"],
    opacity: wrapper.data["opacity"],
    shadow: wrapper.data["shadow"],
    font: wrapper.data["font"],
    cellularComponent: wrapper.data["cellularComponent"],
    layer: wrapper.data["layer"],
    score: wrapper.data["score"],
    rank: wrapper.data["rank"],
    properties: wrapper.data["properties"],
  }

  return node
}

export type EdgeType = 'protein-protein' | 'protein-drug';

export interface Wrapper {
  id: string;
  data: {
    id: string;
    label: string;
    type?: string;
    symbol?: Array<string>;
    drugstoneId?: Array<string> | string;
    drugstoneType: NodeType,
    ensg?: Array<string>;
    entrez?: Array<string>;
    shape?: string;
    color?: string;
    interactions?: any;
    group?: string;
    _group?: string;
    groupName?: string;
    proteinName?: Array<string>;
    uniprot?: Array<string>;
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
    cellularComponent?: Array<string>
    layer?: string;
    isReviewed?: boolean;
    properties?: { [key: string]: any };
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

export type AlgorithmType =
  'trustrank'
  | 'keypathwayminer'
  | 'multisteiner'
  | 'closeness'
  | 'degree'
  | 'proximity'
  | 'betweenness'
  | 'pathway-enrichment'
  | 'leiden-clustering'
  | 'louvain-clustering'
  | 'first-neighbor';
export type QuickAlgorithmType = 'quick' | 'super' | 'connect' | 'connectSelected';

export interface Algorithm {
  slug: AlgorithmType | QuickAlgorithmType;
  name: string;
}

export interface Toast {
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  callback?: () => void;
}

export interface LiveToasts {
  [id: number]: Toast
}
