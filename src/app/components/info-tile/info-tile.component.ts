import {Component, Input, OnInit} from '@angular/core';
import {DrugstoneConfigService} from 'src/app/services/drugstone-config/drugstone-config.service';
import {Wrapper} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {NetworkHandlerService} from '../../services/network-handler/network-handler.service';


@Component({
  selector: 'app-info-tile',
  templateUrl: './info-tile.component.html',
  styleUrls: ['./info-tile.component.scss', '../../pages/explorer-page/explorer-page.component.scss']
})
export class InfoTileComponent implements OnInit {
  @Input() public wrapper: Wrapper;
  @Input() public expressions: any;

  constructor(public drugstoneConfig: DrugstoneConfigService, public analysis: AnalysisService, public networkHandler: NetworkHandlerService) {

  }

  ngOnInit(): void {
  }

  public getExpressionScore() {
    return this.expressions[this.wrapper.id]
  }

  public beautify(url: string): string {
    if (url.startsWith('https://')) {
      url = url.substr('https://'.length);
    } else if (url.startsWith('http://')) {
      url = url.substr('http://'.length);
    }
    const slashPos = url.indexOf('/');
    if (slashPos !== -1) {
      return url.substr(0, slashPos);
    }
    return url;
  }

  writeZeros(n: number) {
    let out = '';
    while (n > 0) {
      out += '0';
      n--;
    }
    return out;
  }
}
