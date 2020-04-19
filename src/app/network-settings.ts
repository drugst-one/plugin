import {WrapperType} from './interfaces';

export class NetworkSettings {

  // Node color
  private static hostColor = '#123456';
  private static virusColor = '#BE093C';
  private static approvedDrugColor = '#48C774';
  private static unapprovedDrugColor = '#F8981D';
  private static nonSeedHostColor = '#3070B3';
  private static nonSeedVirusColor = '#87082c';

  private static selectedBorderColor = '#F8981D';
  private static selectBorderHighlightColor = '#F8981D';

  // Edge color
  private static edgeHostVirusColor = '#686868';
  private static edgeHostVirusHighlightColor = '#686868';
  private static edgeHostDrugColor = '#686868';
  private static edgeHostDrugHighlightColor = '#686868';

  // Border width
  private static selectedBorderWidth = 3;
  private static selectedBorderWidthSelected = 3;

  private static borderWidth = 1;
  private static borderWidthSelected = 3;

  // Node Font
  private static hostFontSize = 20;
  private static virusFontSize = 50;
  private static drugFontSize = 30;
  private static hostFontColor = '#FFFFFF';
  private static virusFontColor = '#FFFFFF';
  private static drugFontColor = '#FFFFFF';
  private static drugInTrialFontColor = 'black';

  // Network Layout
  private static analysisLayout = {
    improvedLayout: true,
  };
  private static analysisEdges = {
    smooth: false,
  };
  private static analysisPhysics = {
    enabled: true,
    stabilization: {
      enabled: true,
    },
    repulsion: {
      centralGravity: 0,
    },
    solver: 'repulsion',
  };
  private static analysisBigPhysics = {
    enabled: false,
  };

  private static mainLayout = {
    improvedLayout: false,
  };
  private static mainEdges = {
    smooth: false,
    length: 250,
  };
  private static mainPhysics = {
    enabled: false,
  };

  // Node size
  private static hostSize = 20;
  private static virusSize = 30;
  private static drugSize = 15;

  // Node shape
  private static hostShape = 'ellipse';
  private static virusShape = 'ellipse';
  private static drugNotInTrialShape = 'box';
  private static drugInTrialShape = 'triangle';

  static getNodeSize(wrapperType: WrapperType) {
    if (wrapperType === 'host') {
      return this.hostSize;
    } else if (wrapperType === 'virus') {
      return this.virusSize;
    } else if (wrapperType === 'drug') {
      return this.drugSize;
    }
  }

  static getNodeShape(wrapperType: WrapperType, drugInTrial?: boolean) {
    if (wrapperType === 'host') {
      return this.hostShape;
    } else if (wrapperType === 'virus') {
      return this.virusShape;
    } else if (wrapperType === 'drug') {
      if (drugInTrial) {
        return this.drugInTrialShape;
      } else {
        return this.drugNotInTrialShape;
      }
    }
  }

  static getOptions(network: 'main' | 'analysis' | 'analysis-big') {
    if (network === 'main') {
      return {
        layout: this.mainLayout,
        edges: this.mainEdges,
        physics: this.mainPhysics,
      };
    } else if (network === 'analysis') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisPhysics,
      };
    } else if (network === 'analysis-big') {
      return {
        layout: this.analysisLayout,
        edges: this.analysisEdges,
        physics: this.analysisBigPhysics,
      };
    }
  }

  static getColor(color: 'host' | 'virus' | 'approvedDrug' | 'unapprovedDrug' | 'hostFont' | 'virusFont' | 'drugFont' |
    'nonSeedHost' | 'nonSeedVirus' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeHostVirus' | 'edgeHostVirusHighlight' | 'edgeHostDrug' | 'edgeHostDrugHighlight') {
    if (color === 'host') {
      return this.hostColor;
    } else if (color === 'virus') {
      return this.virusColor;
    } else if (color === 'approvedDrug') {
      return this.approvedDrugColor;
    } else if (color === 'unapprovedDrug') {
      return this.unapprovedDrugColor;
    } else if (color === 'hostFont') {
      return this.hostFontColor;
    } else if (color === 'virusFont') {
      return this.virusFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'nonSeedHost') {
      return this.nonSeedHostColor;
    } else if (color === 'nonSeedVirus') {
      return this.nonSeedVirusColor;
    } else if (color === 'edgeHostVirus') {
      return this.edgeHostVirusColor;
    } else if (color === 'edgeHostDrug') {
      return this.edgeHostDrugColor;
    } else if (color === 'edgeHostVirusHighlight') {
      return this.edgeHostVirusHighlightColor;
    } else if (color === 'edgeHostDrugHighlight') {
      return this.edgeHostDrugHighlightColor;
    }
  }

  static getFont(wrapperType: WrapperType, drugInTrial?: boolean) {
    if (wrapperType === 'host') {
      return {color: this.hostFontColor, size: this.hostFontSize};
    } else if (wrapperType === 'virus') {
      return {color: this.virusFontColor, size: this.virusFontSize};
    } else if (wrapperType === 'drug') {
      if (!drugInTrial) {
        return {color: this.drugFontColor, size: this.drugFontSize};
      } else {
        return {color: this.drugInTrialFontColor, size: this.drugFontSize};
      }
    }
  }

  static getNodeStyle(nodeType: WrapperType, isSeed: boolean, isSelected: boolean, drugType?: string, drugInTrial?: boolean): any {
    let nodeColor;
    let nodeShape;
    let nodeSize;
    let nodeFont;
    const nodeShadow = true;
    nodeShape = NetworkSettings.getNodeShape(nodeType);
    nodeSize = NetworkSettings.getNodeSize(nodeType);
    nodeFont = NetworkSettings.getFont(nodeType);
    if (nodeType === 'host') {
      nodeColor = NetworkSettings.getColor(nodeType);
      nodeFont = NetworkSettings.getFont('host');
      if (!isSeed) {
        nodeColor = NetworkSettings.getColor('nonSeedHost');
      }
    } else if (nodeType === 'virus') {
      nodeColor = NetworkSettings.getColor(nodeType);
      if (nodeType === 'virus') {
        nodeFont = NetworkSettings.getFont('virus');
        if (!isSeed) {
          nodeColor = NetworkSettings.getColor('nonSeedVirus');
        }
      }
    } else if (nodeType === 'drug') {
      if (drugType === 'approved') {
        nodeColor = NetworkSettings.getColor('approvedDrug');
      } else {
        nodeColor = NetworkSettings.getColor('unapprovedDrug');
      }
      if (drugInTrial) {
        nodeShape = NetworkSettings.getNodeShape('drug', true);
        nodeFont = NetworkSettings.getFont('drug', true);
      } else {
        nodeShape = NetworkSettings.getNodeShape('drug', false);
      }
    }

    const node: any = {
      size: nodeSize,
      shape: nodeShape,
      font: nodeFont,
      shadow: nodeShadow,
    };

    if (isSelected) {
      node.color = {
        background: nodeColor,
        border: this.selectedBorderColor,
        highlight: {
          border: this.selectBorderHighlightColor,
          background: nodeColor,
        },
      };

      node.borderWidth = this.selectedBorderWidth;
      node.borderWidthSelected = this.selectedBorderWidthSelected;
    } else {
      node.color = nodeColor;

      node.borderWidth = this.borderWidth;
      node.borderWidthSelected = this.borderWidthSelected;
    }

    return node;
  }
}

