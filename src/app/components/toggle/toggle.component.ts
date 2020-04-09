import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent implements OnInit {

  @Input() icon = 'fa-check';

  @Input() textOn = 'On';
  @Input() textOff = 'Off';

  @Input() value: boolean;
  @Output() valueChange = new EventEmitter<boolean>();

  constructor() {
  }

  ngOnInit(): void {
  }

  public toggle(value: boolean) {
    this.value = value;
    this.valueChange.emit(this.value);
  }

}
