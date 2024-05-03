import { Component, Input, OnInit } from "@angular/core";
import { LegendContext } from "src/app/interfaces";
import { DrugstoneConfigService } from "src/app/services/drugstone-config/drugstone-config.service";
import { IConfig } from "../../../config";
import { LegendService } from "src/app/services/legend-service/legend-service.service";
import { NetworkHandlerService } from "src/app/services/network-handler/network-handler.service";
import { AnalysisService } from "src/app/services/analysis/analysis.service";

@Component({
  selector: "app-network-legend",
  templateUrl: "./network-legend.component.html",
  styleUrls: ["./network-legend.component.scss"],
})
export class NetworkLegendComponent implements OnInit {
  _context = "explorer";
  _emptyEdgeConfig = false;
  @Input() set context(value: LegendContext) {
    this._context = value;
    this._emptyEdgeConfig = this.checkIfEdgeConfigEmpty();
  }
  @Input() config: IConfig;

  private contextEdgeGroupsToDelete = {
    explorer: ["default"],
    adjacentDrugs: ["default"],
    adjacentDisorders: ["default"],
    adjacentDrugsAndDisorders: ["default"],
    drugTarget: ["default"],
    drug: ["default"],
    drugTargetAndSeeds: ["default"],
    drugAndSeeds: ["default"],
  };


  public get_nodes_to_keep() {
    if (this.analysis.currentNetwork && this.analysis.analysisActive) {
      const uniqueGroups = new Set<string>();
      this.analysis.currentNetwork.nodes.forEach(node => {
        uniqueGroups.add(node.group);
      });
      return Array.from(uniqueGroups);
    }
    const uniqueGroups = new Set<string>();
    this.networkHandler.activeNetwork.inputNetwork.nodes.forEach(node => {
      uniqueGroups.add(node.group);
    });
    return Array.from(uniqueGroups);
  }

  public checkNodeGroupContext(nodeGroupKey) {
    const to_keep = this.get_nodes_to_keep()
    if (to_keep){
      return to_keep.includes(nodeGroupKey);
    }
    if (nodeGroupKey === "selectedNode") {
      // selected node is not supposed to appear in legend
      return false;
    }
    return !this.legendService.get_nodes_to_delete().includes(nodeGroupKey);
  }

  public checkEdgeGroupContext(edgeGroupKey) {
    return !this.contextEdgeGroupsToDelete[this._context].includes(
      edgeGroupKey
    );
  }

  public checkIfEdgeConfigEmpty() {
    return Object.keys(this.config.edgeGroups).some((key) =>
      this.checkEdgeGroupContext(key)
    );
  }

  constructor(
    public drugstoneConfig: DrugstoneConfigService,
    public legendService: LegendService,
    public networkHandler: NetworkHandlerService,
    public analysis: AnalysisService
  ) {}

  ngOnInit(): void {}
}
