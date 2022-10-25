import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-fa-solid-icon',
  templateUrl: './fa-solid-icon.component.html',
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
