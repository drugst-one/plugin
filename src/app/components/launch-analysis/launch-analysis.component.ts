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
  @Output()
  public showChange = new EventEmitter<boolean>();

  public algorithm: AlgorithmType | QuickAlgorithmType;

  public algorithms: Array<Algorithm> = [];

  // Trustrank Parameters
  public trustrankStrain = 'SARS_CoV2';
  public trustrankIncludeIndirectDrugs = false;
  public trustrankIncludeNonApprovedDrugs = false;
  public trustrankDampingFactor = 0.85;
  public trustrankResultSize = 20;

  // Closeness Parameters
  public closenessStrain = 'SARS_CoV2';
  public closenessIncludeIndirectDrugs = false;
  public closenessIncludeNonApprovedDrugs = false;
  public closenessResultSize = 20;

  // Degree Parameters
  public degreeStrain = 'SARS_CoV2';
  public degreeIncludeNonApprovedDrugs = false;
  public degreeResultSize = 20;

  // Keypathwayminer Parameters
  public keypathwayminerK = 1;

  // Multisteiner Parameters
  public multisteinerStrain = 'SARS_CoV2';
  public multisteinerNumTrees = 5;

  public hasBaits;

  public maxTasks = MAX_TASKS;

  constructor(public analysis: AnalysisService) {
    this.hasBaits = !!analysis.getSelection().find((i) => i.type === 'virus');
    analysis.subscribe(() => {
      this.hasBaits = !!analysis.getSelection().find((i) => i.type === 'virus');
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.target === 'drug-target') {
      this.algorithms = [MULTISTEINER, KEYPATHWAYMINER, TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY];
      this.algorithm = MULTISTEINER.slug;
      this.trustrankStrain = 'SARS_CoV2';  // TODO: Change once we have multiple datasets
      this.closenessStrain = 'SARS_CoV2';  // TODO: Change once we have multiple datasets
      this.degreeStrain = 'SARS_CoV2';  // TODO: Change once we have multiple datasets
    } else if (this.target === 'drug') {
      this.algorithms = [TRUSTRANK, CLOSENESS_CENTRALITY, DEGREE_CENTRALITY];
      this.algorithm = TRUSTRANK.slug;
      this.trustrankStrain = 'drugs';
      this.closenessStrain = 'drugs';
      this.degreeStrain = 'drugs';
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
      parameters.strain_or_drugs = this.trustrankStrain;
      parameters.damping_factor = this.trustrankDampingFactor;
      parameters.include_indirect_drugs = this.trustrankIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.trustrankIncludeNonApprovedDrugs;
      parameters.result_size = this.trustrankResultSize;
    } else if (this.algorithm === 'closeness') {
      parameters.strain_or_drugs = this.closenessStrain;
      parameters.include_indirect_drugs = this.closenessIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.closenessIncludeNonApprovedDrugs;
      parameters.result_size = this.closenessResultSize;
    } else if (this.algorithm === 'degree') {
      parameters.strain_or_drugs = this.degreeStrain;
      parameters.include_indirect_drugs = this.closenessIncludeIndirectDrugs;
      parameters.include_non_approved_drugs = this.closenessIncludeNonApprovedDrugs;
      parameters.result_size = this.closenessResultSize;
    } else if (this.algorithm === 'keypathwayminer') {
      parameters.k = this.keypathwayminerK;
    } else if (this.algorithm === 'multisteiner') {
      parameters.strain = this.multisteinerStrain;
      parameters.num_trees = this.multisteinerNumTrees;
    }

    await this.analysis.startAnalysis(this.algorithm, this.target, parameters);
  }

}
