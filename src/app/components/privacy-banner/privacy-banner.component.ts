import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privacy-banner',
  templateUrl: './privacy-banner.component.html',
  styleUrls: ['./privacy-banner.component.scss']
})
export class PrivacyBannerComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log(localStorage.getItem(this.privacyBannerCookieKey) )
    if (localStorage.getItem(this.privacyBannerCookieKey) === 'true') {
      this.disable();
    };
  }

  public disabled = false;
  private privacyBannerCookieKey = `drugstone-privacypolicy-${window.location.host}`;

  public close() {
    this.saveCookie();
    this.disable();
  }

  public disable() {
    this.disabled = true;
  }

  private saveCookie() {
    localStorage.setItem(this.privacyBannerCookieKey, 'true');
  }
}
