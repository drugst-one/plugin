import {Component, Injector} from '@angular/core';
import {ExplorerPageComponent} from './pages/explorer-page/explorer-page.component';
import {createCustomElement} from '@angular/elements';

@Component({
  selector: 'app-root',
  template: `<div></div>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mobileWindowExpanded = false;

  public toggleMobileMenu() {
    this.mobileWindowExpanded = !this.mobileWindowExpanded;
  }

}
