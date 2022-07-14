import { Component, Input, OnInit } from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';

@Component({
  selector: 'app-license-agreement',
  templateUrl: './license-agreement.component.html',
  styleUrls: ['./license-agreement.component.scss']
})
export class LicenseAgreementComponent implements OnInit {

  @Input() show = true;

  public license: string = '';
  private licenseStorageKey = `drugstone-license-${window.location.host}`;

  constructor(public drugstoneConfig: DrugstoneConfigService, public netex: NetexControllerService) { }

  public getAgreed() {
    return sessionStorage.getItem(this.licenseStorageKey) === 'true';
  }

  public setAgreed() {
    sessionStorage.setItem(this.licenseStorageKey, "true");
  }

  async ngOnInit(): Promise<void> {
    if (this.getAgreed()) {
      return
    }
    const response = await this.netex.getLicense();
    this.license = this.format_license_string(response.license);
  }

  public close() {
    this.show = false;
    this.setAgreed();
  }

  private format_license_string(license) {
    const license_array = [];
    let header_started = false;
    let after_header = false;
    license = license.replaceAll('\n', ' <br> ')
    for (let e of license.split(' ')) {
      switch (e) {
        case '====':
          if (!header_started) {
            header_started = true;
            e = '<h1 class="title">';
            break;
          } else {
            header_started = false;
            e = '</h1>';
            after_header = true;
            break;
          }
        case '<br>':
          if (after_header) {
            // ignore linebreaks after header, header has own margin
            continue;
          }
          break;
        case '':
          continue;
        default:
          // as soon as any text appears, integrate linebreaks again
          after_header = false;
          break;
      }
      license_array.push(e)
    }
    return license_array.join(' ');
  }
}
