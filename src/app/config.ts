export interface IConfig {
  legendUrl: string;
  legendClass: string;
  showLeftSidebar: boolean;
}

export const defaultConfig: IConfig = {
  legendUrl: 'https://exbio.wzw.tum.de/covex/assets/leg1.png',
  legendClass: 'legend',
  showLeftSidebar: true,
};
