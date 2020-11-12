export interface IConfig {
  legendUrl: string;
  legendClass: string;
  taskName: string;
  showOverview: boolean;
  showQuery: boolean;
  showFilter: boolean;
  showItemSelector: boolean;
  showSimpleAnalysis: boolean;
  showAdvAnalysis: boolean;
  showTasks: boolean;
  showSelection: boolean;
  showFooter: boolean;
}

export const defaultConfig: IConfig = {
  legendUrl: 'https://exbio.wzw.tum.de/covex/assets/leg1.png',
  taskName: 'Run Task X',
  legendClass: 'legend',
  showOverview: true,
  showQuery: true,
  showFilter: true,
  showItemSelector: true,
  showSimpleAnalysis:false,
  showAdvAnalysis: true,
  showSelection: true,
  showTasks: false,
  showFooter: true,
};
