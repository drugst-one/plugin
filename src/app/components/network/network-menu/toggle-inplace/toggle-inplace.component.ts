import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';

@Component({
  selector: 'app-toggle-inplace',
  templateUrl: './toggle-inplace.component.html',
  styleUrls: ['./toggle-inplace.component.scss']
})
export class ToggleInplaceComponent implements OnInit {

  @Input() iconOn = 'check';
  @Input() iconOff = 'times';

  @Input() text = 'Button';
  @Input() tooltip: string;
  @Input() disabled = false;
  @Input() icon: string;

  @Input() value: boolean;
  @Output() valueChange = new EventEmitter<boolean>();

  constructor(public drugstoneConfig: DrugstoneConfigService) {
  }

  ngOnInit(): void {
  }

  public toggle() {
    this.value = !this.value;
    this.valueChange.emit(this.value);
  }


}
