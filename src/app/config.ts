export interface NodeGroup {
  groupName: string;
  color: string;
  shape: 'circle' | 'triangle' | 'star' | 'square' | 'image';
  type?: string;
  image?: string;
  detailShowLabel?: boolean;
}

export interface EdgeGroup {
  groupName: string;
  color: string;
  // see https://visjs.github.io/vis-network/docs/network/edges.html
  dashes?: false | Array<number>; 
}

export type Identifier = 'symbol'|'uniprot'|'ensg';
export type InteractionDrugProteinDB = 'DrugBank'|'Chembl'|'DGIdb';
export type InteractionProteinProteinDB = 'STRING'|'BioGRID'|'APID';

// TODO: should this be external or integrated in the backend?
export type InteractionDatabase = 'omnipath';

export interface IConfig {
  legendUrl: string;
  legendClass: string;
  legendPos: 'left' | 'right';
  taskName: string;
  showLeftSidebar: boolean;
  showRightSidebar: boolean;
  showOverview: boolean;
  showQuery: boolean;
  showItemSelector: boolean;
  showSimpleAnalysis: boolean;
  showAdvAnalysis: boolean;
  showTasks: boolean;
  showSelection: boolean;
  showFooter: boolean;
  showLegend: boolean;
  showLegendNodes: boolean;
  showLegendEdges: boolean;
  nodeGroups: { [key: string]: NodeGroup };
  edgeGroups: { [key: string]: EdgeGroup };
  interactionDrugProtein: InteractionDrugProteinDB;
  interactionProteinProtein: InteractionProteinProteinDB;
  interactions?: InteractionDatabase;
  identifier?: Identifier;
}

/**
 * Provide default values
 */

export const defaultConfig: IConfig = {
  legendUrl: '', // 'https://exbio.wzw.tum.de/covex/assets/leg1.png' show legend image if set, otherwise default legend
  legendClass: 'legend',
  legendPos: 'left',
  taskName: 'Run Task X',
  showLegendNodes: true,
  showLegendEdges: true,
  showLeftSidebar: true,
  showRightSidebar: true,
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: false,
  showAdvAnalysis: true,
  showSelection: true,
  showTasks: true,
  showFooter: true,
  showLegend: true,
  identifier: 'symbol',
  interactionDrugProtein: 'DrugBank',
  interactionProteinProtein: 'STRING',
  nodeGroups: {
    default: {
      // this default group is used for default node group values
      groupName: 'Default Node Group',
      color: 'yellow',
      shape: 'triangle',
      type: 'protein',
      detailShowLabel: false,
    },
    default_protein: {
      groupName: 'Resulting Proteins',
      color: 'red',
      shape: 'circle',
      type: 'protein',
    },
    default_drug: {
      groupName: 'Possible Drugs',
      color: 'green',
      shape: 'star',
      type: 'drug',
    }
  },
  edgeGroups: {
    default: {
      // this default group is used for default edge group values
      groupName: 'Default Edge Group',
      color: 'black',
      dashes: false
    }
  },
};
