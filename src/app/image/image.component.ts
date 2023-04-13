import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss']
})
export class ImageComponent implements OnInit {

  constructor() { }

  public _source: string;
  public format: string;

  @Input() set _src(src: string) {
    this._source = src;
    // get file ending behind last '.' as format
    this.format = this._source.split('.').slice(-1)[0];
  }

  @Input() _alt: string;
  @Input() _title: string;
  @Input() _class: string;

  ngOnInit(): void {
  }

}
