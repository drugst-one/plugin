import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {
  Algorithm,
  AlgorithmType,
  AnalysisService, CLOSENESS_CENTRALITY,
  DEGREE_CENTRALITY,
  KEYPATHWAYMINER, MAX_TASKS,
  MULTISTEINER,
  QuickAlgorithmType,
  TRUSTRANK
} from '../../analysis.service';

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
  @Input()
  public dataset;
  @Output()
  public showChange = new EventEmitter<boolean>();

  public algorithm: AlgorithmType | QuickAlgorithmType;

  public algorithms: Array<Algorithm> = [];

  // Trustrank Parameters
  public trustrankIncludeIndirectDrugs = false;
  public trustrankIncludeNonApprovedDrugs = false;
  public trustrankIncludeViralNonSeeds = true;
  public trustrankDampingFactor = 0.85;
  public trustrankMaxDeg = 1.0;
  public trustrankHubPenalty = 0.0;
  public trustrankResultSize = 20;

  // Closeness Parameters
  public closenessIncludeIndirectDrugs = false;
  public closenessIncludeNonApprovedDrugs = false;
  public closenessIncludeViralNonSeeds = true;
  public closenessMaxDeg = 1.0;
  public closenessHubPenalty = 0.0;
  public closenessResultSize = 20;

  // Degree Parameters
  public degreeIncludeNonApprovedDrugs = false;
  public degreeIncludeViralNonSeeds = true;
  public degreeMaxDeg = 1.0;
  public degreeResultSize = 20;

  // Keypathwayminer Parameters
  public keypathwayminerK = 1;

  // Multisteiner Parameters
  public multisteinerNumTrees = 5;
  public multisteinerTolerance = 10;
  public multisteinerIncludeViralNonSeeds = true;
  public multisteinerMaxDeg = 1.0;
  public multisteinerHubPenalty = 0.0;

  public hasBaits;

  public maxTasks = MAX_TASKS;

  constructor(public analysis: AnalysisService) {
    this.hasBaits = !!analysis.getSelection().find((i) => i.type === 'virus');
    analysis.subscribeList(() => {
      this.hasBaits = !!analysis.getSelection().find((i) => i.type === 'virus');
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target === 'drug-target') {
      this.algorithms = [MULTISTEINER, KEYPATHWAYMINER, TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY];
      this.algorithm = MULTISTEINER.slug;
    } else if (this.target === 'drug') {
      this.algorithms = [TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY];
      this.algorithm = TRUSTRANK.slug;
    }
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  public async startTask() {
    const parameters: any = {
      seeds: this.analysis.getSelection().map((item) => item.backendId),
    };

    if (this.algorithm === 'trustrank') {
      parameters.strain_or_drugs = this.target === 'drug' ? 'drugs' : this.dataset;
      parameters.damping_factor = this.trustrankDampingFactor;
      parameters.include_indirect_drugs = this.trustrankIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.trustrankIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.trustrankIncludeViralNonSeeds;
      parameters.max_deg = this.trustrankMaxDeg;
      parameters.hub_penalty = this.trustrankHubPenalty;
      parameters.result_size = this.trustrankResultSize;
    } else if (this.algorithm === 'closeness') {
      parameters.strain_or_drugs = this.target === 'drug' ? 'drugs' : this.dataset;
      parameters.include_indirect_drugs = this.closenessIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.closenessIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.closenessIncludeViralNonSeeds;
      parameters.max_deg = this.closenessMaxDeg;
      parameters.hub_penalty = this.closenessHubPenalty;
      parameters.result_size = this.closenessResultSize;
    } else if (this.algorithm === 'degree') {
      parameters.strain_or_drugs = this.target === 'drug' ? 'drugs' : this.dataset;
      parameters.include_non_approved_drugs = this.degreeIncludeNonApprovedDrugs;
      parameters.ignore_non_seed_baits = !this.degreeIncludeViralNonSeeds;
      parameters.max_deg = this.degreeMaxDeg;
      parameters.result_size = this.closenessResultSize;
    } else if (this.algorithm === 'keypathwayminer') {
      parameters.k = this.keypathwayminerK;
    } else if (this.algorithm === 'multisteiner') {
      parameters.strain_or_drugs = this.dataset;
      parameters.num_trees = this.multisteinerNumTrees;
      parameters.tolerance = this.multisteinerTolerance;
      parameters.ignore_non_seed_baits = !this.multisteinerIncludeViralNonSeeds;
      parameters.max_deg = this.multisteinerMaxDeg;
      parameters.hub_penalty = this.multisteinerHubPenalty;
    }

    await this.analysis.startAnalysis(this.algorithm, this.target, parameters);
  }

}
