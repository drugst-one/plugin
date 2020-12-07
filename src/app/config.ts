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
};
