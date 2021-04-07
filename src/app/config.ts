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
  shape: 'round' | 'triangle' | 'rectangle';
  type: 'gene' | 'protein' | 'drug';
}

export interface EdgeGroup {
  name: string;
  color: string;
}

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
      shape: 'round',
      type: 'protein',
    },
    drug: {
      name: 'Possible Drugs',
      color: 'green',
      shape: 'rectangle',
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
