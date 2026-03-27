import {Component} from '@angular/core';

@Component({
  standalone: false,
  standalone: false,
  selector: 'app-root',
  template: `<div></div>`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  mobileWindowExpanded = false;

  public toggleMobileMenu() {
    this.mobileWindowExpanded = !this.mobileWindowExpanded;
  }

}
