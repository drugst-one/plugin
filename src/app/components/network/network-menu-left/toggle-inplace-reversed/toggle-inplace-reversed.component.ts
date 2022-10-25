import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';


@Component({
  selector: 'app-toggle-inplace-reversed',
  templateUrl: './toggle-inplace-reversed.component.html',
  styleUrls: ['./toggle-inplace-reversed.component.scss']
})
export class ToggleInplaceReversedComponent implements OnInit {

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
