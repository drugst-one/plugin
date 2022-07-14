// https://visjs.github.io/vis-network/docs/network/nodes.html
export interface NodeGroup {
  groupName?: string;
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
}

export interface EdgeGroup {
  groupName: string;
  color: string;
  // see https://visjs.github.io/vis-network/docs/network/edges.html
  dashes?: false | Array<number>;
  shadow?: any;
}

export type Identifier = 'symbol'|'uniprot'|'ensg';
export type InteractionDrugProteinDB = 'DrugBank'|'Chembl'|'DGIdb' | 'NeDRex';
export type InteractionProteinProteinDB = 'STRING'|'BioGRID'|'APID' | 'NeDRex';
export type IndicationDrugDisorderDB = 'DrugBank' | 'NeDRex';
export type AssociatedProteinDisorderDB = 'NeDRex' | 'DisGeNET';


// TODO: should this be external or integrated in the backend?
export type InteractionDatabase = 'omnipath';

export interface IConfig {
  title: string;
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
  showTasks: boolean;
  showSelection: boolean;
  showNetworkMenu: false | 'left' | 'right';
  showNetworkMenuButtonExpression: boolean;
  showNetworkMenuButtonScreenshot: boolean;
  showNetworkMenuButtonExportGraphml: boolean;
  showNetworkMenuButtonAdjacentDrugs: boolean;
  showNetworkMenuButtonCenter: boolean;
  networkMenuButtonAdjacentDrugsLabel: string;
  showNetworkMenuButtonAdjacentDisordersProteins: boolean;
  networkMenuButtonAdjacentDisordersProteinsLabel: string;
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
  interactionDrugProtein: InteractionDrugProteinDB;
  interactionProteinProtein: InteractionProteinProteinDB;
  indicationDrugDisorder: IndicationDrugDisorderDB;
  associatedProteinDisorder: AssociatedProteinDisorderDB;
  autofillEdges: boolean;
  interactions?: InteractionDatabase;
  physicsOn?: boolean;
  identifier?: Identifier;
  nodeShadow?: boolean;
  edgeShadow?: boolean;
  useNedrexLicensed?: boolean;
}

/**
 * Provide default values
 */
export const defaultConfig: IConfig = {
  title: 'Drugst.one',
  legendUrl: '', // 'https://exbio.wzw.tum.de/covex/assets/leg1.png' show legend image if set, otherwise default legend
  legendClass: 'legend',
  legendPos: 'left',
  taskTargetName: 'Drug Target Search',
  taskDrugName: 'Drug Search',
  showLegendNodes: true,
  showLegendEdges: true,
  showSidebar: 'left',
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: false,
  showAdvAnalysis: true,
  showSelection: true,
  showTasks: true,
  showNetworkMenu: 'right',
  showLegend: true,
  showNetworkMenuButtonExpression: true,
  showNetworkMenuButtonScreenshot: true,
  showNetworkMenuButtonExportGraphml: true,
  showNetworkMenuButtonAdjacentDrugs: true,
  showNetworkMenuButtonCenter: true,
  networkMenuButtonAdjacentDrugsLabel: 'Drugs',
  showNetworkMenuButtonAdjacentDisordersProteins: true,
  networkMenuButtonAdjacentDisordersProteinsLabel: 'Disorders (protein)',
  showNetworkMenuButtonAdjacentDisordersDrugs: true,
  networkMenuButtonAdjacentDisordersDrugsLabel: 'Disorders (drug)',
  showNetworkMenuButtonAnimation: true,
  networkMenuButtonAnimationLabel: 'Animation',
  identifier: 'symbol',
  interactionDrugProtein: 'NeDRex',
  interactionProteinProtein: 'NeDRex',
  associatedProteinDisorder: 'NeDRex',
  indicationDrugDisorder: 'NeDRex',
  nodeShadow: true,
  edgeShadow: true,
  autofillEdges: true,
  physicsOn: false,
  useNedrexLicensed: true,
  selfReferences: false,
  nodeGroups: {
    // all NodeGroups but the default group must be set, if not provided by the user, they will be taken from here
    // IMPORTANT: node color must be hexacode!
    default: {
      // this default group is used for default node group values
      // and is fallback in case user does not provide any nodeGroup
      groupName: 'Default Node Group',
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
    },
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
