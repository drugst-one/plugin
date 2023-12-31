import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AnalysisService} from '../../services/analysis/analysis.service';
import {getWrapperFromNode, Node, Tissue, NodeAttributeMap} from '../../interfaces';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';

@Component({
  selector: 'app-add-expressed-proteins',
  templateUrl: './add-expressed-proteins.component.html',
  styleUrls: ['./add-expressed-proteins.component.scss']
})
export class AddExpressedProteinsComponent implements OnChanges {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Input()
  public visibleNodes: Array<any> = [];
  @Input()
  public currentViewProteins: Array<Node> = [];
  @Input()
  public selectedTissue: Tissue | null = null;
  @Input()
  public expressionMap: NodeAttributeMap = undefined;

  public proteins = [];
  public threshold = 5;
  public addedCount: number | null = null;
  public loading = false;

  constructor(private http: HttpClient, private analysis: AnalysisService, private netex: NetexControllerService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setThreshold(this.threshold);
  }

  public async addProteins() {
    this.loading = true;
    const result = await this.http.post<any>(`${this.netex.getBackend()}query_tissue_proteins/`,
      {tissueId: this.selectedTissue.drugstoneId, threshold: this.threshold}).toPromise();
    const items = [];
    for (const detail of result) {
      items.push(getWrapperFromNode(detail));
    }
    this.addedCount = this.analysis.addItems(items);
    this.loading = false;
  }

  public addVisibleProteins() {
    this.loading = true;
    // this.addedCount = this.analysis.addExpressedHostProteins(this.visibleNodes, this.currentViewProteins, this.threshold);
    this.loading = false;
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
    if (!this.currentViewProteins || this.expressionMap === undefined) {
      return;
    }
    this.proteins = this.currentViewProteins.flatMap(p => p.drugstoneId).filter(p => this.expressionMap[p] >= threshold);
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
    this.addedCount = null;
  }

}
