import { AlgorithmTarget, AlgorithmType, QuickAlgorithmType } from './interfaces';


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
  highlight?: string;
  arrows?: { to: { type: 'arrow' | 'bar' | 'circle', enabled: boolean, scaleFactor: number } };
}

export type Identifier = 'symbol' | 'uniprot' | 'ensg' | 'entrez';
export type InteractionDrugProteinDB = 'NeDRex' | 'DrugBank' | 'DrugCentral' | 'ChEMBL' | 'DGIdb';
export type InteractionProteinProteinDB = 'NeDRex' | 'BioGRID' | 'IID' | 'IntAct' | 'STRING' | 'APID' | 'OmniPath';
export type IndicationDrugDisorderDB = 'NeDRex' | 'CTD' | 'DrugCentral' | 'DrugBank';
export type AssociatedProteinDisorderDB = 'NeDRex' | 'DisGeNET' | 'OMIM';
export type AdvAnalysisContentTypes = 'drug-target-search' | 'drug-search' | 'pathway-enrichment' | 'enrichment-gprofiler' | 'enrichment-digest' | 'search-ndex';


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
  pathwayEnrichment: string;
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
  showEditNetwork: boolean;
  showPruning: boolean;
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
  showNetworkMenuButtonLayout: boolean;
  showNetworkMenuButtonOverlayDirectedEdges: boolean;
  showNetworkMenuButtonUpload: boolean;
  networkMenuButtonAnimationLabel: string;
  networkMenuButtonLayoutLabel: string;
  networkMenuButtonOverlayDirectedEdgesLabel: string;
  networkMenuButtonUploadLabel: string;
  showLegend: boolean;
  showLegendNodes: boolean;
  showLegendEdges: boolean;
  keepSelectedNodes: boolean;
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
  layoutOn?: boolean;
  overlayDirectedEdges?: boolean;
  physicsInital?: boolean;
  licensedDatasets?: boolean;
  identifier?: Identifier;
  label?: string;
  nodeShadow?: boolean;
  edgeShadow?: boolean;
  customLinks?: {};
  reviewed?: boolean;
  calculateProperties?: boolean;
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
  pathwayEnrichment: 'Pathway enrichment',
  showSidebar: 'left',
  showLegendNodes: true,
  showLegendEdges: true,
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: true,
  showAdvAnalysis: true,
  showAdvAnalysisContent: ['drug-search', 'drug-target-search', 'pathway-enrichment', 'enrichment-gprofiler', 'enrichment-digest', 'search-ndex'],
  showSelection: true,
  showEditNetwork: true,
  showPruning: true,
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
  showNetworkMenuButtonLayout: true,
  showNetworkMenuButtonOverlayDirectedEdges: true,
  showNetworkMenuButtonUpload: true,
  activateNetworkMenuButtonAdjacentDisorders: false,
  showNetworkMenuButtonAdjacentDisordersProteins: true,
  activateNetworkMenuButtonAdjacentDisorderDrugs: false,
  showNetworkMenuButtonAdjacentDisordersDrugs: true,
  showConnectGenes: true,
  networkMenuButtonAdjacentDrugsLabel: 'Drugs',
  networkMenuButtonAdjacentDisordersProteinsLabel: 'Disorders (protein)',
  networkMenuButtonAdjacentDisordersDrugsLabel: 'Disorders (drug)',
  networkMenuButtonAnimationLabel: 'Animation',
  networkMenuButtonLayoutLabel: "Layout",
  networkMenuButtonOverlayDirectedEdgesLabel: "Overlay Directions",
  networkMenuButtonUploadLabel: "Upload",
  identifier: 'symbol',
  label: 'symbol',
  selfReferences: false,
  customEdges: { default: true, selectable: true },
  interactionDrugProtein: 'NeDRex',
  interactionProteinProtein: 'NeDRex',
  indicationDrugDisorder: 'NeDRex',
  associatedProteinDisorder: 'NeDRex',
  autofillEdges: true,
  physicsOn: false,
  layoutOn: false,
  overlayDirectedEdges: false,
  physicsInital: true,
  nodeShadow: true,
  edgeShadow: true,
  licensedDatasets: false,
  reviewed: true,
  calculateProperties: true,
  customLinks: {}, // { test: 'test link', test2: 'test2 link' }
  algorithms: {
    drug: ['trustrank', 'closeness', 'degree', 'proximity'],
    'drug-target': ['trustrank', 'multisteiner', 'keypathwayminer', 'degree', 'closeness', 'betweenness', 'louvain-clustering', 'leiden-clustering', 'first-neighbor'],
    gene: ['pathway-enrichment']
  },
  keepSelectedNodes: false,
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
    overlap: {
      groupName: 'overlap',
      color: {
        border: '#F12590',
        background: '#F12590',
        highlight: {
          border: '#F12590',
          background: '#F12590'
        }
      },
      shape: 'circle',
      type: 'gene',
      borderWidth: 0,
      borderWidthSelected: 0,
      font: {
        color: '#000000',
        size: 14,
        face: 'arial',
        stroke_width: 0,
        stroke_color: '#ffffff',
        align: 'center',
        bold: false,
        ital: false,
        boldital: false,
        mono: false
      },
      shadow: true,
      groupID: 'overlap'
    },


    onlyNetwork: {
      groupName: 'only in network',
      color: {
        border: '#FFFF00',
        background: '#FFFF00',
        highlight: {
          border: '#FFFF00',
          background: '#FFFF00'
        }
      },
      shape: 'circle',
      type: 'gene',
      font: {
        color: '#000000',
        size: 14,
        face: 'arial',
        stroke_width: 0,
        stroke_color: '#ffffff',
        align: 'center',
        bold: false,
        ital: false,
        boldital: false,
        mono: false
      },
      borderWidth: 1,
      borderWidthSelected: 2,
      shadow: true,
      groupID: 'only_network'
    },

    addedNode: {
      groupName: 'added node',
      color: {
        border: '#FFB6C1',
        background: '#FFB6C1',
        highlight: {
          border: '#FFB6C1',
          background: '#FFB6C1'
        }
      },
      shape: 'circle',
      type: 'gene',
      font: {
        color: '#000000',
        size: 14,
        face: 'arial',
        stroke_width: 0,
        stroke_color: '#ffffff',
        align: 'center',
        bold: false,
        ital: false,
        boldital: false,
        mono: false
      },
      borderWidth: 1,
      borderWidthSelected: 2,
      shadow: true,
      groupID: 'added_node'
    },

    onlyPathway: {
      groupName: 'only in pathway',
      color: {
        border: '#FFFF00',
        background: '#FFCC09',
        highlight: {
          border: '#FFFF00',
          background: '#FFCC09'
        }
      },
      shape: 'circle',
      type: 'gene',
      font: {
        color: '#000000',
        size: 14,
        face: 'arial',
        stroke_width: 0,
        stroke_color: '#ffffff',
        align: 'center',
        bold: false,
        ital: false,
        boldital: false,
        mono: false
      },
      borderWidth: 1,
      borderWidthSelected: 2,
      shadow: true,
      groupID: 'only_pathway'
    },

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
    firstNeighbor: {
      groupName: 'First Neighbors',
      shape: 'triangle',
      type: 'gene',
      color: {
        border: '#000000',
        background: '#A8D8FF',
        highlight: {
          border: '#000000',
          background: '#A8D8FF'
        },
      },
      font: {
        color: '#000000',
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
    },
    stimulation: {
      groupName: 'Stimulation',
      color: 'green',
      highlight: 'lightgreen',
      arrows: { to: { type: 'arrow', enabled: true, scaleFactor: 1 } }
    },
    inhibition: {
      groupName: 'Inhibition',
      color: 'red',
      highlight: 'lightcoral',
      arrows: { to: { type: 'bar', enabled: true, scaleFactor: 1 } }
    },
    neutral: {
      groupName: 'Neutral',
      color: 'black',
      highlight: 'lightgray',
      arrows: { to: { type: 'arrow', enabled: true, scaleFactor: 1 } }
    }
  }
};
