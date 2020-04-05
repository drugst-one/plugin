import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-protein-analysis',
  templateUrl: './protein-analysis.component.html',
  styleUrls: ['./protein-analysis.component.scss']
})
export class ProteinAnalysisComponent implements OnInit {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();

  public algorithm: 'dummy' | 'trustrank' = 'dummy';

  public strain = 'SARS_CoV2';
  public dampingFactor = 0.85;
  public resultSize = 20;
  private /*sic!*/ numThreads = 1;

  constructor(public analysis: AnalysisService) {
  }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public async startTask() {
    const parameters: any = {
      proteins: this.analysis.getSelection().map((protein) => protein.proteinAc),
    };

    if (this.algorithm === 'dummy') {
      // No parameters for dummy
    } else if (this.algorithm === 'trustrank') {
      parameters.strain = this.strain;
      parameters.datasets = [];
      parameters.ignored_edge_types = [];
      parameters.damping_factor = this.dampingFactor;
      parameters.result_size = this.resultSize;
      parameters.num_threads = this.numThreads;
    }

    await this.analysis.startAnalysis(this.algorithm, parameters);
  }

}
