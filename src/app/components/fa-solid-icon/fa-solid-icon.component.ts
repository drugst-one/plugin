import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-fa-solid-icon',
  templateUrl: './fa-solid-icon.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./fa-solid-icon.component.scss']
})
export class FaSolidIconComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() classString: string = '';

}
