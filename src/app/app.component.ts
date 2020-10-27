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

  constructor(injector: Injector) {
    // Convert `PopupComponent` to a custom element.
    const NetworkExpander = createCustomElement(ExplorerPageComponent, {injector});
    // Register the custom element with the browser.
    customElements.define('network-expander', NetworkExpander);
  }

  public toggleMobileMenu() {
    this.mobileWindowExpanded = !this.mobileWindowExpanded;
  }

}
