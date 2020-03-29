import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit {

  public showModal = false;
  public groupId = '';
  public geneNames: Array<string> = [];
  public proteinGroup = '';
  public proteinNames: Array<string> = [];
  public proteinACs: Array<string> = [];
  public numberOfInteractions = 0;
  public baitNames: Array<string> = [];

  constructor(private route: ActivatedRoute, private router: Router) {

    this.groupId = 'IFI16';
    this.geneNames.push('IFI16');
    this.proteinNames.push('Gamma-interface-inducible protein 16');
    this.proteinACs.push('Q16666');
    this.numberOfInteractions = 25;
    this.baitNames.push('Bait Protein 1');
    this.baitNames.push('Bait Protein 2');
    this.baitNames.push('Bait Protein 3');
    this.baitNames.push('Bait Protein 4');
    this.baitNames.push('Bait Protein 5');

    this.route.params.subscribe(async (params) => {
      const proteinGroup = params.proteinGroup;
      if (!proteinGroup) {
        // In this case, the URL is just `/explorer`
        // Therefore, we do not show a modal
        this.showModal = false;
        return;
      }

      // In this case, the URL is `/explorer/<proteinGroup>`

      if (this.proteinGroup === proteinGroup) {
        // The protein group is the same as before, so we do not need to do anything
        return;
      }

      // We have a new proteinGroup id, so we need to load it and show the modal...

      this.proteinGroup = proteinGroup;

      // TODO: Perform call here for 'proteinGroup'...

      this.showModal = true;
    });
  }

  ngOnInit() {

  }

  public async openSummary(groupId: string) {
    await this.router.navigate(['explorer', groupId]);
  }

  public async closeSummary() {
    await this.router.navigate(['explorer']);
  }

}
