import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-launch-analysis',
  templateUrl: './launch-analysis.component.html',
  styleUrls: ['./launch-analysis.component.scss']
})
export class LaunchAnalysisComponent implements OnInit {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();

  public algorithm: 'dummy' | 'trustrank' | 'keypathwayminer' | 'multisteiner';

  // Trustrank Parameters
  public trustrankStrain = 'SARS_CoV2';
  public trustrankDampingFactor = 0.85;
  public trustrankResultSize = 20;
  public trustrankNumThreads = 1;
  public trustrankDatasets = [];
  public trustrankIgnoredEdgeTypes = [];

  // Keypathwayminer Parameters
  public keypathwayminerK = 1;

  // Multisteiner Parameters
  public multisteinerStrain = 'SARS_CoV2';
  public multisteinerNumTrees = 5;


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
      parameters.strain = this.trustrankStrain;
      parameters.datasets = [];
      parameters.ignored_edge_types = [];
      parameters.damping_factor = this.trustrankDampingFactor;
      parameters.result_size = this.trustrankResultSize;
      parameters.num_threads = this.trustrankNumThreads;
    } else if (this.algorithm === 'keypathwayminer') {
      // TODO
    } else if (this.algorithm === 'multisteiner') {
      parameters.strain = this.multisteinerStrain;
      parameters.num_trees = this.multisteinerNumTrees;

    }

    await this.analysis.startAnalysis(this.algorithm, parameters);
  }

}
