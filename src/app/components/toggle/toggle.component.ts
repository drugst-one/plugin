import {Component, Directive, EventEmitter, Input, OnInit, Output} from '@angular/core';

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

  @Input() smallStyle: boolean;

  @Input() value: boolean;
  @Output() valueChange = new EventEmitter<boolean>();

  constructor() {
  }

  ngOnInit(): void {
  }

  public toggle(value: boolean) {
    if(this.value === value)
      return;
    this.value = value;
    this.valueChange.emit(this.value);
  }

}
