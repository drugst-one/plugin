import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Identifier } from 'typescript';

@Component({
  selector: 'app-network-upload-dialog',
  templateUrl: './network-upload-dialog.component.html',
  styleUrls: ['./network-upload-dialog.component.scss']
})
export class NetworkUploadDialogComponent implements OnInit {

  @Input()
  public show = false;
  @Output()
  public showChange = new EventEmitter<boolean>();
  @Output()
  public uploadEvent = new EventEmitter<{ file: File, idSpace: string }>();

  selectedFile: File | null = null;
  selectedIdSpace: string | null = "symbol";

  idSpaces = ["symbol", "uniprot", "entrez", "ensg"];


  constructor() { }

  ngOnInit(): void {
  }

  public close() {
    this.show = false;
    this.showChange.emit(this.show);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  launchUpload(): void {
    if (this.selectedFile && this.selectedIdSpace) {
      this.uploadEvent.emit({ file: this.selectedFile, idSpace: this.selectedIdSpace });
      this.selectedFile = null;
      this.close();
    }
  }

}
