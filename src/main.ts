import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import './polyfills';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  // tslint:disable-next-line:no-console
  .catch(err => console.error(err));

const loadPage = (name: string) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', name, true);
  xhr.onreadystatechange = function() {
    if (this.readyState !== 4) { return; }
    if (this.status !== 200) { return; } // or whatever error handling you want
    document.getElementById('example').innerHTML = this.responseText;
  };
  xhr.send();
};

loadPage('app-test/icons.html');
