export interface IConfig {
  legendUrl: string;
  legendClass: string;
  showOverview: boolean;
  showFooter: boolean;
  showQuery: boolean;
  showFilter: boolean;
}

export const defaultConfig: IConfig = {
  legendUrl: 'https://exbio.wzw.tum.de/covex/assets/leg1.png',
  legendClass: 'legend',
  showOverview: true,
  showQuery: true,
  showFilter: true,

  showFooter: false,
};
