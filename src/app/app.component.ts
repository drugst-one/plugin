import {Component, Injector} from '@angular/core';
import {ExplorerPageComponent} from "./pages/explorer-page/explorer-page.component";
import {createCustomElement}  from '@angular/elements';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mobileWindowExpanded = false;

  public toggleMobileMenu() {
    this.mobileWindowExpanded = !this.mobileWindowExpanded;
  }



  constructor(injector: Injector) {
    // Convert `PopupComponent` to a custom element.
    const PopupElement = createCustomElement(ExplorerPageComponent, {injector});
    // Register the custom element with the browser.
    customElements.define('explorer-element', PopupElement);
  }

}






