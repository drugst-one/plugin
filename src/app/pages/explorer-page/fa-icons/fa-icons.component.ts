import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-fa-icons',
  templateUrl: './fa-icons.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./fa-icons.component.scss']
})
export class FaIconsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
