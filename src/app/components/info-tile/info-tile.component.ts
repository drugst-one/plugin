import { Component, Input, OnInit } from "@angular/core";
import { DrugstoneConfigService } from "src/app/services/drugstone-config/drugstone-config.service";
import { Wrapper } from "../../interfaces";
import { AnalysisService } from "../../services/analysis/analysis.service";
import { NetworkHandlerService } from "../../services/network-handler/network-handler.service";
import { validateComponent } from "codelyzer/walkerFactory/walkerFn";

@Component({
  selector: "app-info-tile",
  templateUrl: "./info-tile.component.html",
  styleUrls: [
    "./info-tile.component.scss",
    "../../pages/explorer-page/explorer-page.component.scss",
  ],
})
export class InfoTileComponent implements OnInit {
  @Input() set wrapper(wrapperObject: Wrapper) {
    this._wrapper = wrapperObject;
    this.checkIfShowLinks();
    this.getLayer();
    this._wrapper.data.layer = this.layer;
  }
  @Input() public expressions: any;

  public layer;

  public linkoutMap = { iid: "IID" };

  public _showLinks: boolean = false;
  public _wrapper?: Wrapper ;

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public analysis: AnalysisService,
    public networkHandler: NetworkHandlerService
  ) {}

  ngOnInit(): void {}

  public getExpressionScore() {
    return this.expressions[this._wrapper.id];
  }

  public getCustomLink(customLinkKey) { 
    const nodeCustomLinkKey = `${customLinkKey}Link`;
    if (nodeCustomLinkKey in this._wrapper.data) {
      return this._wrapper.data[nodeCustomLinkKey]
    } else {
      return false
    }
  }

  public getLayer(){
    const layer_mapping: { [key: string]: string } = {
      'GO:0005737': "Cytoplasm",
      'GO:0005634': "Nucleus",
      'GO:0005576': "Extracellular",
      'GO:0009986': "Cell surface",
      'GO:0005886': "Plasma membrane"
    };

    if (this._wrapper.data.cellularComponent.length > 0){
      let layers: Set<string> = new Set();
      const cc = this._wrapper.data.cellularComponent
      cc.forEach((c) => {
        const splitted = c.split(":")
        const layer = "GO:" + splitted[3]
        layers.add(layer)
      });
      if (layers.size > 1){
        this.layer = "Multiple"
      } else {
        this.layer = layer_mapping[Array.from(layers)[0]]
      }
    } else {
      this.layer = "Unknown"
    }
  }

  public beautify(url: string): string {
    if (url.startsWith("https://")) {
      url = url.substr("https://".length);
    } else if (url.startsWith("http://")) {
      url = url.substr("http://".length);
    }
    const slashPos = url.indexOf("/");
    if (slashPos !== -1) {
      return url.substr(0, slashPos);
    }
    return url;
  }

  writeZeros(n: number) {
    let out = "";
    while (n > 0) {
      out += "0";
      n--;
    }
    return out;
  }

  public checkIfShowLinks() {
    const idSpace = this.drugstoneConfig.currentConfig().identifier;
    this._showLinks =
      (["symbol", "uniprot", "entrez"].includes(idSpace) &&
      this._wrapper.data[idSpace] != null) ||
    this._wrapper.data.uniprot != null ||
    this._wrapper.data.type === "drug";
    
  }

  showLinkout(target) {
    const idSpace = this.drugstoneConfig.currentConfig().identifier;
    switch (target) {
      case "iid":
        return (
          (["symbol", "uniprot", "entrez"].includes(idSpace) &&
            this._wrapper.data[idSpace] != null) ||
          this._wrapper.data.uniprot != null
        );
    }
    return false;
  }

  getIIDQuery() {
    const idSpace = this.drugstoneConfig.currentConfig().identifier;
    if (
      ["symbol", "uniprot", "entrez"].includes(idSpace) &&
      this._wrapper.data[idSpace] != null
    ) {
      return this._wrapper.data[idSpace][0];
    }
    return this._wrapper.data.uniprot[0];
  }

  getLinkoutURL(target) {
    // const idSpace = this.drugstoneConfig.currentConfig().identifier;
    switch (target) {
      case "iid":
        return (
          "http://iid.ophid.utoronto.ca/SearchPPIs/protein/" +
          this.getIIDQuery()
        );
    }
    return "";
  }
}
