import {Component, Directive, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss', '../../pages/explorer-page/explorer-page.component.scss']
})
export class ToggleComponent implements OnInit {

  @Input() iconOn = 'fa-check';
  @Input() iconOff = 'fa-times';

  @Input() textOn = 'On';
  @Input() textOff = 'Off';
  @Input() tooltipOn: string;
  @Input() tooltipOff: string;
  @Input() disabled = false;
  @Input() icon: string;


  @Input() value: boolean;
  @Output() valueChange = new EventEmitter<boolean>();

  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {
  }

  public toggle(  ) {
    this.value = !this.value
    this.valueChange.emit(this.value);
  }

}
