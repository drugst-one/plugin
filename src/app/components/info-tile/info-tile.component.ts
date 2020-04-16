import {Component, Input, OnInit} from '@angular/core';
import {Wrapper} from '../../interfaces';
import {AnalysisService} from '../../analysis.service';

@Component({
  selector: 'app-info-tile',
  templateUrl: './info-tile.component.html',
  styleUrls: ['./info-tile.component.scss']
})
export class InfoTileComponent implements OnInit {

  @Input()
  public wrapper: Wrapper;

  constructor(public analysis: AnalysisService) { }

  ngOnInit(): void {
  }

}
