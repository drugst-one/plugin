import { Component, OnInit } from '@angular/core';
import {DrugstoneConfigService} from '../../services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-privacy-banner',
  templateUrl: './privacy-banner.component.html',
  styleUrls: ['./privacy-banner.component.scss']
})
export class PrivacyBannerComponent implements OnInit {

  constructor(public drugstoneConfig: DrugstoneConfigService) { }

  ngOnInit(): void {
    if (localStorage.getItem(this.privacyBannerCookieKey) === 'true') {
      this.disable();
    };
  }

  public disabled = false;
  private privacyBannerCookieKey = `drugstone-legal-${window.location.host}`;

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
