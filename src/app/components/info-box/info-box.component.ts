import {Component, Input, OnInit} from '@angular/core';
import {Wrapper} from '../../interfaces';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-info-box',
  templateUrl: './info-box.component.html',
  styleUrls: ['./info-box.component.scss']
})
export class InfoBoxComponent implements OnInit {

  @Input()
  public wrapper: Wrapper;

  constructor(public analysis: AnalysisService) { }

  ngOnInit(): void {
  }

}
