import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {getWrapperFromProtein, Wrapper} from '../../interfaces';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-custom-proteins',
  templateUrl: './custom-proteins.component.html',
  styleUrls: ['./custom-proteins.component.scss']
})
export class CustomProteinsComponent implements OnInit {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();

  public textList = '';
  public proteins: Array<string> = [];
  public notFound: Array<string> = [];
  public itemsAdded: Array<Wrapper> = [];

  constructor(private http: HttpClient, private analysis: AnalysisService) { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public async addProteins() {
    this.notFound = [];
    this.itemsAdded = [];
    const proteins = this.proteins;
    this.changeTextList('');
    const result = await this.http.post<any>(`${environment.backend}query_proteins/`, proteins).toPromise();
    this.notFound = result.notFound;
    const details = result.details;
    const items = [];
    for (const detail of details) {
      items.push(getWrapperFromProtein(detail));
    }
    this.itemsAdded = items;
    this.analysis.addItems(items);
  }

  public changeTextList(textList) {
    this.textList = textList;
    if (!textList) {
      this.proteins = [];
      return;
    }

    const separators = ['\n', ',', ';', ' '];

    let proteins;
    for (const sep of separators) {
      if (textList.indexOf(sep) === -1) {
        continue;
      }
      proteins = textList.split(sep).map(ac => ac.trim()).filter(ac => !!ac);
      break;
    }

    if (!proteins) {
      proteins = [textList];
    }

    this.proteins = proteins;
  }

}
