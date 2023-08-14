import {AlgorithmTarget, AlgorithmType, QuickAlgorithmType} from './interfaces';


// https://visjs.github.io/vis-network/docs/network/nodes.html
export interface NodeGroup {
  groupName?: string;
  groupID?: string;
  color?: any;
  shape?: 'circle' | 'triangle' | 'star' | 'square' | 'image' | 'text' | 'ellipse' | 'box' | 'diamond' | 'dot';
  type?: string;
  image?: string;
  detailShowLabel?: boolean;
  font?: any;
  border?: any;
  highlight?: any;
  borderWidth?: number;
  borderWidthSelected?: number;
  background?: any;
  shadow?: any;
  ctxRenderer?: any;
}

export interface EdgeGroup {
  groupName: string;
  color: string;
  // see https://visjs.github.io/vis-network/docs/network/edges.html
  dashes?: false | Array<number>;
  shadow?: any;
}

export type Identifier = 'symbol' | 'uniprot' | 'ensg' | 'entrez';
export type InteractionDrugProteinDB = 'NeDRex' | 'DrugBank' | 'DrugCentral' | 'ChEMBL' | 'DGIdb';
export type InteractionProteinProteinDB = 'NeDRex' | 'BioGRID' | 'IID' | 'IntAct' | 'STRING' | 'APID';
export type IndicationDrugDisorderDB = 'NeDRex' | 'CTD' | 'DrugCentral' | 'DrugBank';
export type AssociatedProteinDisorderDB = 'NeDRex' | 'DisGeNET' | 'OMIM';
export type AdvAnalysisContentTypes = 'drug-target-search' | 'drug-search' | 'enrichment-gprofiler' | 'enrichment-digest' | 'search-ndex';


// TODO: should this be external or integrated in the backend?
export type InteractionDatabase = 'omnipath';

export interface IConfig {
  title: string;
  backendUrl: string;
  legendUrl: string;
  legendClass: string;
  legendPos: 'left' | 'right';
  taskTargetName: string;
  taskDrugName: string;
  showSidebar: false | 'left' | 'right';
  showOverview: boolean;
  showQuery: boolean;
  showItemSelector: boolean;
  showSimpleAnalysis: boolean;
  showAdvAnalysis: boolean;
  showAdvAnalysisContent: Array<AdvAnalysisContentTypes>;
  showTasks: boolean;
  showViews: boolean;
  showSelection: boolean;
  showNetworkMenu: false | 'left' | 'right';
  expandNetworkMenu: boolean;
  showNetworkMenuButtonExpression: boolean;
  showNetworkMenuButtonScreenshot: boolean;
  showNetworkMenuButtonExportGraphml: boolean;
  showNetworkMenuButtonAdjacentDrugs: boolean;
  activateNetworkMenuButtonAdjacentDrugs: boolean;
  showNetworkMenuButtonCenter: boolean;
  showConnectGenes: boolean;
  networkMenuButtonAdjacentDrugsLabel: string;
  showNetworkMenuButtonAdjacentDisordersProteins: boolean;
  activateNetworkMenuButtonAdjacentDisorders: boolean;
  networkMenuButtonAdjacentDisordersProteinsLabel: string;
  activateNetworkMenuButtonAdjacentDisorderDrugs: boolean;
  showNetworkMenuButtonAdjacentDisordersDrugs: boolean;
  networkMenuButtonAdjacentDisordersDrugsLabel: string;
  showNetworkMenuButtonAnimation: boolean;
  networkMenuButtonAnimationLabel: string;
  showLegend: boolean;
  showLegendNodes: boolean;
  showLegendEdges: boolean;
  nodeGroups: { [key: string]: NodeGroup };
  edgeGroups: { [key: string]: EdgeGroup };
  selfReferences: boolean;
  customEdges: { default: boolean, selectable: boolean };
  interactionDrugProtein: InteractionDrugProteinDB;
  interactionProteinProtein: InteractionProteinProteinDB;
  indicationDrugDisorder: IndicationDrugDisorderDB;
  associatedProteinDisorder: AssociatedProteinDisorderDB;
  autofillEdges: boolean;
  interactions?: InteractionDatabase;
  physicsOn?: boolean;
  licensedDatasets?: boolean;
  identifier?: Identifier;
  nodeShadow?: boolean;
  edgeShadow?: boolean;
  customLinks?: {};
  algorithms: { [key in AlgorithmTarget]: Array<AlgorithmType | QuickAlgorithmType> };
}


const defaultNodeGroup: NodeGroup = {
  // this default group is used for default node group values
  // and is fallback in case user does not provide any nodeGroup
  groupName: 'Default Node Group',
  ctxRenderer: null,
  color: {
    border: '#FFFF00',
    background: '#FFFF00',
    highlight: {
      border: '#FF0000',
      background: '#FF0000'
    },
  },
  shape: 'triangle',
  type: 'default type',
  detailShowLabel: false,
  font: {
    color: '#000000',
    size: 14,
    face: 'arial',
    background: undefined,
    strokeWidth: 0,
    strokeColor: '#ffffff',
    align: 'center',
    bold: false,
    ital: false,
    boldital: false,
    mono: false,
  },
  borderWidth: 1,
  borderWidthSelected: 2
};
const connectorNodeGroup: NodeGroup = JSON.parse(JSON.stringify(defaultNodeGroup));
connectorNodeGroup.groupName = 'Connector Nodes';

// @ts-ignore
/**
 * Provide default values
 */
export const defaultConfig: IConfig = {
  title: 'Drugst.One',
  backendUrl: '',
  legendUrl: '',
  legendClass: 'legend',
  legendPos: 'left',
  taskTargetName: 'Drug target search',
  taskDrugName: 'Drug search',
  showSidebar: 'left',
  showLegendNodes: true,
  showLegendEdges: true,
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: true,
  showAdvAnalysis: true,
  showAdvAnalysisContent: ['drug-search', 'drug-target-search', 'enrichment-gprofiler', 'enrichment-digest', 'search-ndex'],
  showSelection: true,
  showTasks: true,
  showViews: true,
  showNetworkMenu: 'right',
  showLegend: true,
  expandNetworkMenu: true,
  showNetworkMenuButtonExpression: true,
  showNetworkMenuButtonScreenshot: true,
  showNetworkMenuButtonExportGraphml: true,
  showNetworkMenuButtonAdjacentDrugs: true,
  activateNetworkMenuButtonAdjacentDrugs: false,
  showNetworkMenuButtonCenter: true,
  showNetworkMenuButtonAnimation: true,
  activateNetworkMenuButtonAdjacentDisorders: false,
  showNetworkMenuButtonAdjacentDisordersProteins: true,
  activateNetworkMenuButtonAdjacentDisorderDrugs: false,
  showNetworkMenuButtonAdjacentDisordersDrugs: true,
  showConnectGenes: true,
  networkMenuButtonAdjacentDrugsLabel: 'Drugs',
  networkMenuButtonAdjacentDisordersProteinsLabel: 'Disorders (protein)',
  networkMenuButtonAdjacentDisordersDrugsLabel: 'Disorders (drug)',
  networkMenuButtonAnimationLabel: 'Animation',
  identifier: 'symbol',
  selfReferences: false,
  customEdges: {default: true, selectable: true},
  interactionDrugProtein: 'NeDRex',
  interactionProteinProtein: 'NeDRex',
  indicationDrugDisorder: 'NeDRex',
  associatedProteinDisorder: 'NeDRex',
  autofillEdges: true,
  physicsOn: false,
  nodeShadow: true,
  edgeShadow: true,
  licensedDatasets: false,
  customLinks: {}, // { test: 'test link', test2: 'test2 link' }
  algorithms: {
    drug: ['trustrank', 'closeness', 'degree', 'proximity'],
    'drug-target': ['trustrank', 'multisteiner', 'keypathwayminer', 'degree', 'closeness', 'betweenness']
  },
  nodeGroups: {
    // all NodeGroups but the default group must be set, if not provided by the user, they will be taken from here
    // IMPORTANT: node color must be hexacode!
    default: defaultNodeGroup,
    foundNode: {
      groupName: 'Found Nodes',
      color: {
        border: '#F12590',
        background: '#F12590',
        highlight: {
          border: '#F12590',
          background: '#F12590'
        },
      },
      shape: 'circle',
      type: 'default node type',
    },
    connectorNode: connectorNodeGroup,
    foundDrug: {
      groupName: 'Drugs',
      color: {
        border: '#F12590',
        background: '#F12590',
        highlight: {
          border: '#F12590',
          background: '#F12590'
        },
      },
      shape: 'diamond',
      type: 'default drug type',
    },
    defaultDisorder: {
      groupName: 'Disorders',
      color: {
        border: '#ffa62f',
        background: '#ffa62f',
        highlight: {
          border: '#ffa62f',
          background: '#ffa62f'
        },
      },
      shape: 'triangle',
      type: 'default disorder type',
    },
    seedNode: {
      groupName: 'Seed Nodes',
      shape: 'triangle',
      type: 'seed',
      color: {
        border: '#F1111D',
        background: '#F1111D',
        highlight: {
          border: '#F1111D',
          background: '#F1111D'
        },
      },
      font: {
        color: '#F1111D',
        size: 14
      }
    },
    selectedNode: {
      borderWidth: 3,
      borderWidthSelected: 4,
      color: {
        border: '#F8981D',
        highlight: {
          border: '#F8981D',
        },
      },
      font: {
        color: '#F8981D',
        size: 14
      }
    }
  },
  edgeGroups: {
    default: {
      // this default group is used for default edge group values
      groupName: 'Default Edge Group',
      color: 'black',
      dashes: false
    }
  }
};
