import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import cytoscape, { Core, EventObject, LayoutOptions } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { EntityNode, EntityEdge } from '@/lib/graph-engine/types';
import { DataProtectionService } from '@/lib/security/data-protection';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Layers,
  Circle,
  GitCommit,
  ShieldAlert,
  Smartphone,
  Fingerprint,
  Lock,
  Maximize2,
} from 'lucide-react';

// Register dagre layout plugin safely (idempotent)
try {
  cytoscape.use(dagre);
} catch {
  // Already registered
}

export type LayoutMode = 'pipeline' | 'ring' | 'force';

interface ForceGraphCanvasProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  selectedNodeId?: string;
  onSelectNode: (node: EntityNode) => void;
  filterRiskThreshold?: number;
  privacyMaskingEnabled?: boolean;
}

export const ForceGraphCanvas: React.FC<ForceGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  filterRiskThreshold = 0,
  privacyMaskingEnabled = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('pipeline');
  const [hoveredNode, setHoveredNode] = useState<EntityNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Fund Journey Replay States
  const [isPlayingFlow, setIsPlayingFlow] = useState<boolean>(true);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [flowSpeed, setFlowSpeed] = useState<number>(1); // 1x or 2x

  // Filtered nodes based on risk threshold
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (n) => n.riskScore >= filterRiskThreshold || n.type === 'device' || n.type === 'bvn'
    );
  }, [nodes, filterRiskThreshold]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered and chronologically sorted edges
  const filteredEdges = useMemo(() => {
    const list = edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    return [...list].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [edges, filteredNodeIds]);

  // Financial edges only (excludes static device/bvn links) for fund journey replay
  const financialHops = useMemo(() => {
    return filteredEdges.filter(
      (e) => e.relationType !== 'AUTHENTICATED_ON' && e.relationType !== 'REGISTERED_TO_BVN'
    );
  }, [filteredEdges]);

  const currentHopEdge = financialHops[activeHopIndex] || null;

  // Helper to format node labels with privacy masking
  const formatNodeLabel = useCallback(
    (n: EntityNode) => {
      if (n.type === 'device') {
        return n.label.replace('DEV-', '');
      }
      if (n.type === 'bvn') {
        return privacyMaskingEnabled
          ? `BVN ···${n.label.slice(-4)}`
          : n.label;
      }
      if (n.type === 'account') {
        const masked = privacyMaskingEnabled
          ? DataProtectionService.maskAccountNumber(n.label, true)
          : n.label;
        return masked;
      }
      return n.label;
    },
    [privacyMaskingEnabled]
  );

  // Helper to get node color
  const getNodeColor = (n: EntityNode) => {
    if (n.isFrozen) return '#DC2626'; // Red freeze
    if (n.type === 'device') return '#F97316'; // Orange device
    if (n.type === 'bvn') return '#06B6D4'; // Cyan BVN
    if (n.riskScore >= 90) return '#EF4444'; // High risk red
    if (n.riskScore >= 60) return '#F59E0B'; // Medium risk amber
    return '#10B981'; // Low risk emerald
  };

  // Convert application nodes and edges into Cytoscape elements definition
  const cytoscapeElements = useMemo(() => {
    const elements: cytoscape.ElementDefinition[] = [];

    filteredNodes.forEach((n) => {
      const displayLabel = formatNodeLabel(n);
      const nodeColor = getNodeColor(n);

      elements.push({
        group: 'nodes',
        data: {
          id: n.id,
          label: displayLabel,
          type: n.type,
          riskScore: n.riskScore,
          isFrozen: n.isFrozen ? 'true' : 'false',
          color: nodeColor,
          rawNode: n,
        },
      });
    });

    filteredEdges.forEach((e) => {
      const isDeviceLink = e.relationType === 'AUTHENTICATED_ON';
      const isBvnLink = e.relationType === 'REGISTERED_TO_BVN';
      const amountMillions = (e.amount / 1_000_000).toFixed(1);
      const amountLabel = isDeviceLink || isBvnLink ? '' : `₦${amountMillions}M`;

      let edgeColor = '#64748B'; // Default slate
      if (isDeviceLink) edgeColor = '#F97316';
      else if (isBvnLink) edgeColor = '#06B6D4';
      else if (e.isHighRisk || e.typology === 'circular') edgeColor = '#EF4444';
      else edgeColor = '#94A3B8';

      elements.push({
        group: 'edges',
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          amount: e.amount,
          amountLabel,
          rail: e.rail,
          color: edgeColor,
          relationType: e.relationType || 'FINANCIAL_TRANSFER',
          isDeviceLink: isDeviceLink ? 'true' : 'false',
          isBvnLink: isBvnLink ? 'true' : 'false',
          rawEdge: e,
        },
      });
    });

    return elements;
  }, [filteredNodes, filteredEdges, formatNodeLabel]);

  // Layout configuration generator
  const getLayoutConfig = useCallback((mode: LayoutMode): LayoutOptions => {
    switch (mode) {
      case 'pipeline':
        // Forensic Left-to-Right Directed Flow (Dagre)
        return {
          name: 'dagre',
          // @ts-expect-error cytoscape-dagre properties
          rankDir: 'LR',
          nodeSep: 60,
          rankSep: 140,
          edgeSep: 30,
          animate: true,
          animationDuration: 500,
          fit: true,
          padding: 60,
        };
      case 'ring':
        // Closed Loop / Circular Flow (Ideal for circular mule typologies)
        return {
          name: 'circle',
          animate: true,
          animationDuration: 500,
          fit: true,
          padding: 60,
          spacingFactor: 1.15,
        };
      case 'force':
      default:
        // Organic Compound Spring Embedder (No Overlap Collision Solver)
        return {
          name: 'cose',
          animate: true,
          animationDuration: 600,
          refresh: 20,
          fit: true,
          padding: 60,
          nodeOverlap: 30,
          idealEdgeLength: () => 120,
          edgeElasticity: () => 100,
          nodeRepulsion: () => 450000,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        };
    }
  }, []);

  // Initialize and maintain Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Cytoscape Dark Forensics Theme Stylesheet
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      boxSelectionEnabled: false,
      autounselectify: false,
      wheelSensitivity: 0.25,
      style: [
        // Core Node Default
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            'font-size': '10px',
            'font-weight': 600,
            color: '#F8FAFC',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#0B0F17',
            'text-background-opacity': 0.88,
            'text-background-padding': '3px',
            'text-border-color': '#1E293B',
            'text-border-width': 1,
            'text-border-opacity': 0.8,
            'background-color': 'data(color)',
            'border-width': 2,
            'border-color': '#1E293B',
            width: 44,
            height: 44,
            'transition-property': 'background-color, border-color, border-width, width, height, opacity',
            'transition-duration': 200,
          },
        },
        // Account Type Nodes
        {
          selector: 'node[type = "account"]',
          style: {
            shape: 'ellipse',
            width: 46,
            height: 46,
          },
        },
        // Device Type Nodes
        {
          selector: 'node[type = "device"]',
          style: {
            shape: 'diamond',
            width: 42,
            height: 42,
            'border-color': '#EA580C',
            'border-width': 2,
          },
        },
        // BVN Identity Nodes
        {
          selector: 'node[type = "bvn"]',
          style: {
            shape: 'hexagon',
            width: 44,
            height: 44,
            'border-color': '#0891B2',
            'border-width': 2,
          },
        },
        // Frozen Accounts
        {
          selector: 'node[isFrozen = "true"]',
          style: {
            'border-color': '#EF4444',
            'border-width': 4,
            'background-color': '#B91C1C',
          },
        },
        // Selected Node Highlight State
        {
          selector: 'node:selected, node.selected',
          style: {
            'border-color': '#F59E0B',
            'border-width': 4,
            width: 52,
            height: 52,
          },
        },
        // Hovered Node
        {
          selector: 'node.hovered',
          style: {
            'border-color': '#38BDF8',
            'border-width': 3,
          },
        },
        // Dimmed Nodes (During neighborhood inspection or replay)
        {
          selector: 'node.dimmed',
          style: {
            opacity: 0.25,
          },
        },
        // Highlighted Neighborhood Nodes
        {
          selector: 'node.highlighted',
          style: {
            opacity: 1,
            'border-color': '#F59E0B',
            'border-width': 3,
          },
        },

        // CORE EDGES: The Bézier Multigraph Arc Revolution!
        {
          selector: 'edge',
          style: {
            // Bezier curve separates parallel multi-hop transactions cleanly with ZERO overlap
            'curve-style': 'bezier',
            'control-point-step-size': 40,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            width: 2.5,
            label: 'data(amountLabel)',
            'font-family': 'ui-monospace, SFMono-Regular, Menlo, monospace',
            'font-size': '9px',
            'font-weight': 600,
            color: '#F1F5F9',
            'text-background-color': '#0B0F17',
            'text-background-opacity': 0.88,
            'text-background-padding': '2px',
            'text-border-color': '#334155',
            'text-border-width': 1,
            'text-rotation': 'autorotate',
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 200,
          },
        },
        // Device Link Edges (dashed)
        {
          selector: 'edge[isDeviceLink = "true"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [4, 4],
            'target-arrow-shape': 'circle',
            width: 2,
          },
        },
        // BVN Link Edges (dotted)
        {
          selector: 'edge[isBvnLink = "true"]',
          style: {
            'line-style': 'dotted',
            'target-arrow-shape': 'tee',
            width: 2,
          },
        },
        // Active Replay Hop Edge Glow
        {
          selector: 'edge.active-hop',
          style: {
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
            width: 5,
            'line-style': 'solid',
            opacity: 1,
            'z-index': 999,
          },
        },
        // Highlighted Neighborhood Edges
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#F59E0B',
            'target-arrow-color': '#F59E0B',
            width: 3.5,
            opacity: 1,
          },
        },
        // Dimmed Edges
        {
          selector: 'edge.dimmed',
          style: {
            opacity: 0.15,
          },
        },
      ],
    });

    cyRef.current = cy;

    // Node Tap / Select Listener
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const rawNode: EntityNode = node.data('rawNode');
      if (rawNode) {
        onSelectNode(rawNode);
      }
    });

    // Node Hover Listeners
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target;
      const rawNode: EntityNode = node.data('rawNode');
      if (rawNode) {
        setHoveredNode(rawNode);
        const renderedPos = node.renderedPosition();
        setHoverPos({ x: renderedPos.x, y: renderedPos.y });
        node.addClass('hovered');

        // Highlight connected edges and 1-hop neighbors
        const connectedEdges = node.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes();

        cy.elements().addClass('dimmed');
        node.removeClass('dimmed').addClass('highlighted');
        connectedNodes.removeClass('dimmed').addClass('highlighted');
        connectedEdges.removeClass('dimmed').addClass('highlighted');
      }
    });

    cy.on('mouseout', 'node', (evt: EventObject) => {
      setHoveredNode(null);
      setHoverPos(null);
      evt.target.removeClass('hovered');
      cy.elements().removeClass('dimmed highlighted');
    });

    // Background Tap Clears Selection
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setHoveredNode(null);
        setHoverPos(null);
        cy.elements().removeClass('dimmed highlighted selected');
      }
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [onSelectNode]);

  // Synchronize elements smoothly in batches without recreating Cytoscape
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const existingNodeIds = new Set(cy.nodes().map((n) => n.id()));
    const existingEdgeIds = new Set(cy.edges().map((e) => e.id()));

    const newNodes = cytoscapeElements.filter((el) => el.group === 'nodes');
    const newEdges = cytoscapeElements.filter((el) => el.group === 'edges');

    const newNodeIds = new Set(newNodes.map((n) => n.data.id));
    const newEdgeIds = new Set(newEdges.map((e) => e.data.id));

    cy.batch(() => {
      // Remove elements no longer present
      cy.nodes().forEach((n) => {
        if (!newNodeIds.has(n.id())) cy.remove(n);
      });
      cy.edges().forEach((e) => {
        if (!newEdgeIds.has(e.id())) cy.remove(e);
      });

      // Update existing nodes or add new ones
      newNodes.forEach((n) => {
        if (existingNodeIds.has(n.data.id!)) {
          cy.getElementById(n.data.id!).data(n.data);
        } else {
          cy.add(n);
        }
      });

      // Update existing edges or add new ones
      newEdges.forEach((e) => {
        if (existingEdgeIds.has(e.data.id!)) {
          cy.getElementById(e.data.id!).data(e.data);
        } else {
          cy.add(e);
        }
      });
    });

    // Run layout if element count changed or initial load
    if (newNodeIds.size !== existingNodeIds.size || existingNodeIds.size === 0) {
      cy.layout(getLayoutConfig(layoutMode)).run();
    }
  }, [cytoscapeElements, getLayoutConfig, layoutMode]);

  // Synchronize layout when layoutMode changes
  useEffect(() => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout(getLayoutConfig(layoutMode));
    layout.run();
  }, [layoutMode, getLayoutConfig]);

  // Synchronize selected node state
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass('selected');
    if (selectedNodeId) {
      const targetNode = cy.getElementById(selectedNodeId);
      if (targetNode.length > 0) {
        targetNode.addClass('selected');
      }
    }
  }, [selectedNodeId]);

  // Synchronize Fund Journey Replay Highlight
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.edges().removeClass('active-hop');
    cy.nodes().removeClass('active-hop-node');

    if (currentHopEdge) {
      const edgeEl = cy.getElementById(currentHopEdge.id);
      if (edgeEl.length > 0) {
        edgeEl.addClass('active-hop');
        const sourceNode = cy.getElementById(currentHopEdge.source);
        const targetNode = cy.getElementById(currentHopEdge.target);
        sourceNode.addClass('active-hop-node');
        targetNode.addClass('active-hop-node');
      }
    }
  }, [currentHopEdge]);

  // Fund Journey Replay Interval Timer
  useEffect(() => {
    if (!isPlayingFlow || financialHops.length === 0) return;

    const intervalMs = flowSpeed === 2 ? 1500 : 2500;
    const timer = setInterval(() => {
      setActiveHopIndex((prev) => (prev + 1) % financialHops.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlayingFlow, flowSpeed, financialHops.length]);

  // Zoom and fit controls
  const handleZoomIn = () => {
    if (!cyRef.current) return;
    cyRef.current.zoom({
      level: cyRef.current.zoom() * 1.25,
      renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 },
    });
  };

  const handleZoomOut = () => {
    if (!cyRef.current) return;
    cyRef.current.zoom({
      level: cyRef.current.zoom() * 0.8,
      renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 },
    });
  };

  const handleResetView = () => {
    if (!cyRef.current) return;
    cyRef.current.fit(undefined, 60);
  };

  return (
    <div className="relative w-full h-full bg-[#070A0F] overflow-hidden select-none">
      {/* Background Micro Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Main Cytoscape Canvas DOM Mounting Node */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Accessible Screen Reader Entity Navigation */}
      <div className="sr-only" aria-live="polite">
        <p>
          Financial Intelligence Cytoscape Graph contains {filteredNodes.length} entities and{' '}
          {filteredEdges.length} relation edges.
          {selectedNodeId ? ` Selected entity: ${selectedNodeId}.` : ' No entity selected.'}
        </p>
        <ul>
          {filteredNodes.slice(0, 10).map((n) => (
            <li key={n.id}>
              <button onClick={() => onSelectNode(n)}>
                Select {n.type} {n.label} with risk score {n.riskScore}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* TOP FLOATING FORENSIC CONTROLS */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#0B0F17]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#1E293B] shadow-2xl z-20 font-mono text-xs">
        {/* Layout Algorithms Switcher */}
        <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-lg border border-[#1E293B]">
          <button
            onClick={() => setLayoutMode('pipeline')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'pipeline'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dagre Hierarchical: Originators (Left) -> Layering Mules (Center) -> Cashout Sinks (Right)"
          >
            <GitCommit className="size-3" />
            <span>Flow Pipeline (Dagre)</span>
          </button>

          <button
            onClick={() => setLayoutMode('ring')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'ring'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Geometric Circular Layout: Directly exposes closed-loop circular money laundering (Typology 03)"
          >
            <Circle className="size-3" />
            <span>Syndicate Ring</span>
          </button>

          <button
            onClick={() => setLayoutMode('force')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'force'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="CoSE Physics Layout: Compound spring embedder with collision avoidance"
          >
            <Layers className="size-3" />
            <span>Network (CoSE)</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#1E293B]" />

        {/* Zoom & Fit Actions */}
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Fit Graph to Viewport"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* HOVER TOOLTIP CARD */}
      {hoveredNode && hoverPos && (
        <div
          className="absolute pointer-events-none z-30 bg-[#0B0F17]/95 border border-[#1E293B] rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs font-mono"
          style={{
            left: Math.min(hoverPos.x + 20, (containerRef.current?.clientWidth || 800) - 240),
            top: Math.max(hoverPos.y - 40, 20),
          }}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1E293B] mb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              {hoveredNode.type === 'device' && <Smartphone className="size-3.5 text-orange-400" />}
              {hoveredNode.type === 'bvn' && <Fingerprint className="size-3.5 text-cyan-400" />}
              {hoveredNode.type === 'account' && <ShieldAlert className="size-3.5 text-amber-400" />}
              <span>{hoveredNode.type}</span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredNode.riskScore >= 90
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : hoveredNode.riskScore >= 60
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              Risk: {hoveredNode.riskScore}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">ID:</span>{' '}
              <span className="text-white font-semibold">
                {privacyMaskingEnabled && hoveredNode.type === 'account'
                  ? DataProtectionService.maskAccountNumber(hoveredNode.id, true)
                  : hoveredNode.id}
              </span>
            </div>
            {hoveredNode.isFrozen && (
              <div className="text-red-400 font-bold flex items-center gap-1">
                <Lock className="size-3" />
                <span>Core PND Freeze Active</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Total Inflow:</span>{' '}
              <span className="text-emerald-400">
                ₦{(hoveredNode.metrics.totalInflow / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <div>
              <span className="text-slate-500">Total Outflow:</span>{' '}
              <span className="text-amber-400">
                ₦{(hoveredNode.metrics.totalOutflow / 1_000_000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLLER: Chronological Fund Journey Step-by-Step Replay */}
      {financialHops.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-[#0B0F17]/95 backdrop-blur-md px-5 py-3 rounded-2xl border border-[#1E293B] shadow-2xl z-20 font-mono text-xs max-w-xl w-[90%] sm:w-full">
          {/* Active Hop Detailed Description */}
          <div className="w-full flex items-center justify-between text-[11px] pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-400 shrink-0">
                HOP {activeHopIndex + 1} OF {financialHops.length}:
              </span>
              {currentHopEdge && (
                <span className="text-white font-bold truncate">
                  {privacyMaskingEnabled
                    ? DataProtectionService.maskAccountNumber(currentHopEdge.source, true)
                    : currentHopEdge.source}{' '}
                  <span className="text-amber-400">
                    &rarr; ₦{(currentHopEdge.amount / 1_000_000).toFixed(1)}M ({currentHopEdge.rail}) &rarr;
                  </span>{' '}
                  {privacyMaskingEnabled
                    ? DataProtectionService.maskAccountNumber(currentHopEdge.target, true)
                    : currentHopEdge.target}
                </span>
              )}
            </div>

            <button
              onClick={() => setFlowSpeed((prev) => (prev === 1 ? 2 : 1))}
              className="text-[10px] px-2 py-0.5 rounded bg-[#141B26] text-amber-300 border border-[#1E293B] hover:border-amber-500/40 cursor-pointer shrink-0 ml-2"
            >
              {flowSpeed}x SPEED
            </button>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setActiveHopIndex((prev) => (prev - 1 + financialHops.length) % financialHops.length)
              }
              className="p-1.5 rounded-lg bg-[#141B26] hover:bg-[#1E293B] text-slate-300 hover:text-white cursor-pointer"
              title="Previous Hop"
            >
              <SkipBack className="size-3.5" />
            </button>

            <button
              onClick={() => setIsPlayingFlow(!isPlayingFlow)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 cursor-pointer"
            >
              {isPlayingFlow ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              <span>{isPlayingFlow ? 'Pause Flow' : 'Replay Fund Journey'}</span>
            </button>

            <button
              onClick={() => setActiveHopIndex((prev) => (prev + 1) % financialHops.length)}
              className="p-1.5 rounded-lg bg-[#141B26] hover:bg-[#1E293B] text-slate-300 hover:text-white cursor-pointer"
              title="Next Hop"
            >
              <SkipForward className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForceGraphCanvas;
