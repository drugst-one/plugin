import {WrapperType} from './interfaces';

export class NetworkSettings {

  // Node color
  private static hostColor = '#123456';
  private static virusColor = '#BE093C';
  private static drugColor = '#F8981D';
  private static seedHostColor = '#3070B3';
  private static seedVirusColor = '#3070B3';

  private static selectedBorderColor = '#F8981D';
  private static selectBorderHighlightColor = '#F8981D';
  private static selectedBorderWidth = 3;
  private static selectedBorderWidthSelected = 3.2;

  // Edge color
  private static edgeHostVirusColor = '#686868';
  private static edgeHostVirusHighlightColor = '#686868';
  private static edgeHostDrugColor = '#686868';
  private static edgeHostDrugHighlightColor = '#686868';

  // Node Font
  private static hostFontSize = 20;
  private static virusFontSize = 50;
  private static drugFontSize = 30;
  private static hostFontColor = '#FFFFFF';
  private static virusFontColor = '#FFFFFF';
  private static drugFontColor = '#FFFFFF';

  // Network Layout
  private static analysisLayout = {
    improvedLayout: true,
  };
  private static analysisEdges = {
    smooth: false,
    length: 400,
  };
  private static analysisPhysics = {
    enabled: true,
    stabilization: {
      enabled: true,
    },
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
  private static drugShape = 'box';

  static getNodeSize(wrapperType: WrapperType) {
    if (wrapperType === 'host') {
      return this.hostSize;
    } else if (wrapperType === 'virus') {
      return this.virusSize;
    } else if (wrapperType === 'drug') {
      return this.drugSize;
    }
  }

  static getNodeShape(wrapperType: WrapperType) {
    if (wrapperType === 'host') {
      return this.hostShape;
    } else if (wrapperType === 'virus') {
      return this.virusShape;
    } else if (wrapperType === 'drug') {
      return this.drugShape;
    }
  }

  static getOptions(network: 'main' | 'analysis') {
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
    }
  }

  static getColor(color: 'host' | 'virus' | 'drug' | 'hostFont' | 'virusFont' | 'drugFont' |
    'seedHost' | 'seedVirus' | 'selectedForAnalysis' | 'selectedForAnalysisText' |
    'edgeHostVirus' | 'edgeHostVirusHighlight' | 'edgeHostDrug' | 'edgeHostDrugHighlight') {
    if (color === 'host') {
      return this.hostColor;
    } else if (color === 'virus') {
      return this.virusColor;
    } else if (color === 'drug') {
      return this.drugColor;
    } else if (color === 'hostFont') {
      return this.hostFontColor;
    } else if (color === 'virusFont') {
      return this.virusFontColor;
    } else if (color === 'drugFont') {
      return this.drugFontColor;
    } else if (color === 'seedHost') {
      return this.seedHostColor;
    } else if (color === 'seedVirus') {
      return this.seedVirusColor;
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

  static getFont(wrapperType: WrapperType) {
    if (wrapperType === 'host') {
      return {color: this.hostFontColor, size: this.hostFontSize};
    } else if (wrapperType === 'virus') {
      return {color: this.virusFontColor, size: this.virusFontSize};
    } else if (wrapperType === 'drug') {
      return {color: this.drugFontColor, size: this.drugFontSize};
    }
  }

  static getNodeStyle(nodeType: WrapperType, isSeed: boolean, isSelected: boolean): any {
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
      if (isSeed) {
        nodeColor = NetworkSettings.getColor('seedHost');
      }
    } else if (nodeType === 'virus') {
      nodeColor = NetworkSettings.getColor(nodeType);
      if (nodeType === 'virus') {
        nodeFont = NetworkSettings.getFont('virus');
        if (isSeed) {
          nodeColor = NetworkSettings.getColor('seedVirus');
        }
      }
    } else if (nodeType === 'drug') {
      nodeColor = NetworkSettings.getColor(nodeType);
    }

    const node: any = {size: nodeSize, color: nodeColor, shape: nodeShape, font: nodeFont, shadow: nodeShadow};

    if (isSelected) {
      node.color = {color: node.color, border: this.selectedBorderColor, highlight: {border: this.selectBorderHighlightColor}};
      node.borderWidth = this.selectedBorderWidth;
      node.borderWidthSelected = this.selectedBorderWidthSelected;
    }
    return node;
  }
}

