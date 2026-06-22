import { Component, Input, OnInit } from "@angular/core";
import { LegendContext } from "src/app/interfaces";
import { DrugstoneConfigService } from "src/app/services/drugstone-config/drugstone-config.service";
import { IConfig } from "../../../config";
import { LegendService } from "src/app/services/legend-service/legend-service.service";
import { NetworkHandlerService } from "src/app/services/network-handler/network-handler.service";
import { AnalysisService } from "src/app/services/analysis/analysis.service";

@Component({
  standalone: false,
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

  private directedEdgeGroups = new Set<string>([
    "stimulation",
    "inhibition",
    "neutral",
  ]);

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

  private getDisplayedNodes(): any[] {
    const nodeData = this.networkHandler.activeNetwork.nodeData?.nodes;
    if (nodeData?.get) {
      return nodeData.get();
    }
    if (Array.isArray(this.networkHandler.activeNetwork.currentViewNodes)) {
      return this.networkHandler.activeNetwork.currentViewNodes;
    }
    if (Array.isArray(this.networkHandler.activeNetwork.inputNetwork?.nodes)) {
      return this.networkHandler.activeNetwork.inputNetwork.nodes;
    }
    return [];
  }

  private hasDisplayedNodes(): boolean {
    return this.getDisplayedNodes().length > 0;
  }

  private getDisplayedNodeGroupKey(node: any): string | null {
    if (!node) {
      return null;
    }
    if (typeof node.group === "string" && node.group.length > 0) {
      return node.group;
    }
    if (typeof node.groupID === "string" && node.groupID.length > 0) {
      return node.groupID;
    }
    if (typeof node.groupId === "string" && node.groupId.length > 0) {
      return node.groupId;
    }
    if (typeof node._group === "string" && node._group.length > 0) {
      return node._group;
    }
    return null;
  }

  public get_nodes_to_keep() {
    const uniqueGroups = new Set<string>();
    if (this.legendService.context.includes("adjacentDisorders")) {
      uniqueGroups.add("defaultDisorder");
    }
    if (this.legendService.context.includes("adjacentDrugs")) {
      uniqueGroups.add("foundDrug");
    }

    this.getDisplayedNodes().forEach((node) => {
      const groupKey = this.getDisplayedNodeGroupKey(node);
      if (groupKey) {
        uniqueGroups.add(groupKey);
      }
    });

    return Array.from(uniqueGroups);
  }

  public checkNodeGroupContext(nodeGroupKey) {
    if (!this.hasDisplayedNodes()) {
      return false;
    }

    const to_keep = this.get_nodes_to_keep()
    if (to_keep.length > 0){
      return to_keep.includes(nodeGroupKey);
    }
    return !this.legendService.get_nodes_to_delete().includes(nodeGroupKey);
  }

  public checkEdgeGroupContext(edgeGroupKey) {
    const display = !this.contextEdgeGroupsToDelete[this._context].includes(edgeGroupKey)
    if (this.directedEdgeGroups.has(edgeGroupKey)) {
      if (this.drugstoneConfig.currentConfig().interactionProteinProtein == "OmniPath" || this.drugstoneConfig.currentConfig().overlayDirectedEdges) {
        return true;
      }
      return false;
    }
    return display;
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
