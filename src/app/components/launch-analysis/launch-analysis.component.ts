import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AnalysisService} from '../../analysis.service';

interface Algorithm {
  slug: string;
  name: string;
}

const TRUSTRANK: Algorithm = {slug: 'trustrank', name: 'Trust-Rank'};
const KEYPATHWAYMINER: Algorithm = {slug: 'keypathwayminer', name: 'KeyPathwayMiner'};
const MULTISTEINER: Algorithm = {slug: 'multisteiner', name: 'Multi-Steiner'};

@Component({
  selector: 'app-launch-analysis',
  templateUrl: './launch-analysis.component.html',
  styleUrls: ['./launch-analysis.component.scss']
})
export class LaunchAnalysisComponent implements OnInit, OnChanges {

  @Input()
  public show = false;
  @Input()
  public target: 'drug' | 'drug-target';
  @Output()
  public showChange = new EventEmitter<boolean>();

  public algorithm: 'trustrank' | 'keypathwayminer' | 'multisteiner';

  public algorithms: Array<Algorithm> = [];

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

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target === 'drug-target') {
      this.algorithms = [TRUSTRANK, MULTISTEINER, KEYPATHWAYMINER];
      this.trustrankStrain = 'SARS_CoV2';
    } else if (this.target === 'drug') {
      this.algorithms = [TRUSTRANK];
      this.trustrankStrain = 'drugs';
    }
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public async startTask() {
    const parameters: any = {
      seeds: this.analysis.getSelection().map((item) => item.name),
    };

    if (this.algorithm === 'trustrank') {
      parameters.strain_or_drugs = this.trustrankStrain;
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

    await this.analysis.startAnalysis(this.algorithm, this.target, parameters);
  }

}
