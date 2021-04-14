// export interface NodeGroup {
//   fill: string;
// }
//
// export interface EdgeGroup {
//   color: string;
// }

export interface NodeGroup {
  name: string;
  color: string;
  shape: 'circle' | 'triangle' | 'star' | 'square' | 'image';
  type: 'gene' | 'protein' | 'drug';
  image?: string;
}

export interface EdgeGroup {
  name: string;
  color: string;
}

export type Identifier = 'hugo'|'uniprot';

export type InteractionDatabase = 'omnipath';

export interface IConfig {
  legendUrl: string;
  legendClass: string;
  legendPos: 'left' | 'right';
  taskName: string;
  showLeftSidebar: boolean;
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
  interactions?: InteractionDatabase;
  identifier?: Identifier;
}

export const defaultConfig: IConfig = {
  legendUrl: '', // 'https://exbio.wzw.tum.de/covex/assets/leg1.png' show legend image if set, otherwise default legend
  legendClass: 'legend',
  legendPos: 'left',
  taskName: 'Run Task X',
  showLegendNodes: true,
  showLegendEdges: true,
  showLeftSidebar: true,
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: false,
  showAdvAnalysis: true,
  showSelection: true,
  showTasks: true,
  showFooter: true,
  showLegend: true,
  identifier: 'hugo',
  nodeGroups: {
    default: {
      name: 'Default Group',
      color: 'yellow',
      shape: 'triangle',
      type: 'gene',
    },
    protein: {
      name: 'Resulting Proteins',
      color: 'red',
      shape: 'circle',
      type: 'protein',
    },
    drug: {
      name: 'Possible Drugs',
      color: 'green',
      shape: 'star',
      type: 'drug',
    }
  },
  edgeGroups: {
    default: {
      name: 'Edgy edges',
      color: 'black'
    }
  },
};
