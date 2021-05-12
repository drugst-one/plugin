import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {getWrapperFromNode, Node, Wrapper} from '../../interfaces';
import {AnalysisService} from '../../services/analysis/analysis.service';

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
  @Input()
  public visibleNodes: Array<any> = [];

  public textList = '';
  public proteins: Array<string> = [];
  public notFound: Array<string> = [];
  public itemsFound: Array<Wrapper> = [];
  public addedCount = 0;
  public selectOnly = false;
  public loading = false;

  constructor(private http: HttpClient, private analysis: AnalysisService) { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.textList = '';
    this.proteins = [];
    this.notFound = [];
    this.itemsFound = [];
    this.showChange.emit(this.show);
    this.addedCount = 0;
    this.selectOnly = false;
  }

  public async addProteins() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    const proteins = this.proteins;
    this.changeTextList('');
    const result = await this.http.post<any>(`${environment.backend}query_proteins/`, proteins).toPromise();
    this.notFound = result.notFound;
    const details = result.details;
    const items = [];
    for (const detail of details) {
      items.push(getWrapperFromNode(detail));
    }
    this.itemsFound = items;
    this.addedCount = this.analysis.addItems(items);
    this.selectOnly = false;
    this.loading = false;
  }

  public async addVisibleProteins() {
    this.loading = true;
    this.notFound = [];
    this.itemsFound = [];
    const proteins = this.proteins;
    this.changeTextList('');
    const result = await this.http.post<any>(`${environment.backend}query_proteins/`, proteins).toPromise();
    this.notFound = result.notFound;
    const details = result.details;
    const proteinItems = [];
    const items = [];
    for (const detail of details) {
      proteinItems.push(detail as Node);
      items.push(getWrapperFromNode(detail));
    }
    this.itemsFound = items;
    // this.addedCount = this.analysis.addVisibleHostProteins(this.visibleNodes, proteinItems);
    this.selectOnly = true;
    this.loading = false;
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
