// export interface NodeGroup {
//   fill: string;
// }
//
// export interface EdgeGroup {
//   color: string;
// }

type NodeGroup = any;
type EdgeGroup = any;

export interface IConfig {
  legendUrl: string;
  legendClass: string;
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
  nodeGroups: { [key: string]: NodeGroup };
  edgeGroups: { [key: string]: EdgeGroup };
}

export const defaultConfig: IConfig = {
  legendUrl: 'https://exbio.wzw.tum.de/covex/assets/leg1.png',
  legendClass: 'legend',
  taskName: 'Run Task X',
  showLeftSidebar: true,
  showOverview: true,
  showQuery: true,
  showItemSelector: true,
  showSimpleAnalysis: false,
  showAdvAnalysis: true,
  showSelection: true,
  showTasks: true,
  showFooter: true,
  nodeGroups: {
    default: {
      color: 'white'
    },
    protein: {
      color: 'red'
    },
    drug: {
      color: 'green'
    }
  },
  edgeGroups: {
    default: {
      color: 'black'
    }
  },
};
