export interface Theme {
  background: string;
  'panel-background': string;
  'panel-border': string;
  'network-background': string;
  color1: string;
  color2: string;
  'text-primary': string;
  'text-secondary': string;
  success: string;
  warn: string;
  error: string;
}

export const defaultTheme: Theme  = {
  background : '#fff',
  'panel-background': '#fff',
  'panel-border': '#ededed',
  'network-background': '#fff',
  color1: '#00d1b2',
  color2: '#3273dc',
  'text-primary': '#000',
  'text-secondary': '#fff',
  success: '#48c774',
  warn: '#C78E48',
  error: '#f14668'
};
