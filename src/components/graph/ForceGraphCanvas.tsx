import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EntityNode, EntityEdge } from '@/lib/graph-engine/types';

interface ForceGraphCanvasProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  selectedNodeId?: string;
  onSelectNode: (node: EntityNode) => void;
  filterRiskThreshold?: number;
}

export const ForceGraphCanvas: React.FC<ForceGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  filterRiskThreshold = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Transform states (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<EntityNode | null>(null);

  // Interactive drag state refs (to avoid excessive re-renders during 60fps drag)
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragNodeRef = useRef<EntityNode | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const particleOffsetRef = useRef<number>(0);

  // Filtered nodes based on risk threshold (always keep device and bvn nodes if connected)
  const filteredNodes = nodes.filter(
    (n) => n.riskScore >= filterRiskThreshold || n.type === 'device' || n.type === 'bvn'
  );
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Center nodes initially if needed
  useEffect(() => {
    if (nodes.length > 0) {
      const radius = Math.min(240, 60 + nodes.length * 15);
      nodes.forEach((node, i) => {
        if (!node.isPinned) {
          const angle = (i / nodes.length) * Math.PI * 2;
          node.x = Math.cos(angle) * radius;
          node.y = Math.sin(angle) * radius;
          node.vx = 0;
          node.vy = 0;
        }
      });
      setTransform({ x: 0, y: 0, scale: 1 });
    }
  }, [nodes]);

  // Main Simulation & Rendering Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // 1. Force Physics Simulation Step with Spatial Cutoff
    const repulsion = 4800;
    const springLength = 130;
    const springK = 0.038;
    const centerGravity = 0.014;
    const damping = 0.85;
    const maxRepulsionDistSq = 90000; // 300px spatial cutoff

    // Repulsion between all node pairs
    for (let i = 0; i < filteredNodes.length; i++) {
      const n1 = filteredNodes[i];
      for (let j = i + 1; j < filteredNodes.length; j++) {
        const n2 = filteredNodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy + 100;
        if (distSq > maxRepulsionDistSq) continue; // Spatial optimization

        const dist = Math.sqrt(distSq);
        const force = repulsion / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!n1.isPinned) {
          n1.vx -= fx;
          n1.vy -= fy;
        }
        if (!n2.isPinned) {
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // Spring attraction along active edges
    const nodeLookup = new Map(filteredNodes.map((n) => [n.id, n]));
    for (const edge of filteredEdges) {
      const s = nodeLookup.get(edge.source);
      const t = nodeLookup.get(edge.target);
      if (s && t) {
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetLen = edge.typology === 'device_link' || edge.typology === 'bvn_link' ? 90 : springLength;
        const displacement = dist - targetLen;
        const force = displacement * springK;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!s.isPinned) {
          s.vx += fx;
          s.vy += fy;
        }
        if (!t.isPinned) {
          t.vx -= fx;
          t.vy -= fy;
        }
      }
    }

    // Center gravity and position integration
    for (const n of filteredNodes) {
      if (!n.isPinned) {
        n.vx -= n.x * centerGravity;
        n.vy -= n.y * centerGravity;

        n.vx *= damping;
        n.vy *= damping;

        n.x += n.vx;
        n.y += n.vy;
      }
    }

    // Particle flow animation tick
    particleOffsetRef.current = (particleOffsetRef.current + 0.015) % 1;

    // 2. Clear Canvas & Set Background Grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Apply viewport transform (pan & zoom centered)
    ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const gridBound = 600;
    for (let x = -gridBound; x <= gridBound; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -gridBound);
      ctx.lineTo(x, gridBound);
      ctx.stroke();
    }
    for (let y = -gridBound; y <= gridBound; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-gridBound, y);
      ctx.lineTo(gridBound, y);
      ctx.stroke();
    }

    // 3. Render Edges (with direction arrows and particles)
    for (const edge of filteredEdges) {
      const s = nodeLookup.get(edge.source);
      const t = nodeLookup.get(edge.target);
      if (!s || !t) continue;

      const isDeviceLink = edge.typology === 'device_link' || edge.relationType === 'AUTHENTICATED_ON';
      const isBvnLink = edge.typology === 'bvn_link' || edge.relationType === 'REGISTERED_TO_BVN';
      const isHighRisk = edge.isHighRisk || edge.typology === 'circular';

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isDeviceLink) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)'; // Purple dashed for hardware
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
      } else if (isBvnLink) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.55)'; // Cyan dotted for BVN
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
      } else if (isHighRisk) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Directed Arrowhead for financial flows
      if (!isDeviceLink && !isBvnLink) {
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        const angle = Math.atan2(t.y - s.y, t.x - s.x);
        const arrowSize = 6;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize * 1.5, -arrowSize);
        ctx.lineTo(-arrowSize * 1.5, arrowSize);
        ctx.closePath();
        ctx.fillStyle = isHighRisk ? '#EF4444' : '#F59E0B';
        ctx.fill();
        ctx.restore();

        // Flowing Money Particle (HALTED IF SOURCE IS FROZEN VIA PND!)
        if (!s.isFrozen) {
          const px = s.x + (t.x - s.x) * particleOffsetRef.current;
          const py = s.y + (t.y - s.y) * particleOffsetRef.current;
          ctx.beginPath();
          ctx.arc(px, py, isHighRisk ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isHighRisk ? '#EF4444' : '#FBBF24';
          ctx.shadowColor = isHighRisk ? '#EF4444' : '#F59E0B';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // 4. Render Nodes
    for (const node of filteredNodes) {
      const isSelected = node.id === selectedNodeId;
      const isHovered = hoveredNode?.id === node.id;
      const isCritical = node.riskScore >= 75;
      const isDevice = node.type === 'device';
      const isBvn = node.type === 'bvn';
      const isBeneficiary = node.type === 'beneficiary';
      const isFrozen = !!node.isFrozen;
      const radius = isSelected ? 24 : isDevice ? 18 : 20;

      // Glow behind high-risk, frozen, or selected nodes
      if (isFrozen) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
      } else if (isCritical || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.25)';
        ctx.fill();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isFrozen
        ? '#3A0D0D'
        : isSelected
        ? '#F59E0B'
        : isCritical
        ? '#181C26'
        : isDevice
        ? '#2E1065' // Distinct Purple for Device
        : isBvn
        ? '#083344' // Distinct Cyan for BVN
        : isBeneficiary
        ? '#3B0764'
        : '#12151D';
      ctx.fill();

      // Node Border
      ctx.lineWidth = isFrozen ? 3.5 : isSelected ? 3 : isCritical ? 2.5 : 1.5;
      ctx.strokeStyle = isFrozen
        ? '#EF4444'
        : isSelected
        ? '#FFFFFF'
        : isCritical
        ? '#EF4444'
        : isDevice
        ? '#A855F7'
        : isBvn
        ? '#06B6D4'
        : isHovered
        ? '#FBBF24'
        : 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      // Node Icon / Short Label inside circle
      ctx.fillStyle = isSelected ? '#08090C' : '#FFFFFF';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const typePrefix =
        isDevice
          ? 'DEV'
          : isBvn
          ? 'BVN'
          : node.type === 'beneficiary'
          ? 'BEN'
          : node.type === 'merchant'
          ? 'POS'
          : 'ACC';
      ctx.fillText(typePrefix, node.x, node.y - 3);

      // Risk score mini badge
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isSelected
        ? '#08090C'
        : isFrozen
        ? '#FCA5A5'
        : isCritical
        ? '#EF4444'
        : isDevice
        ? '#C084FC'
        : isBvn
        ? '#67E8F9'
        : '#94A3B8';
      ctx.fillText(`${node.riskScore}`, node.x, node.y + 6);

      // PND Frozen Badge Badge
      if (isFrozen) {
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('🔒 PND HOLD', node.x, node.y - radius - 10);
      }

      // Node Full ID Label underneath
      ctx.font = '500 10px "Inter", sans-serif';
      ctx.fillStyle = isFrozen ? '#EF4444' : isSelected ? '#F59E0B' : '#E2E8F0';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + radius + 14);
    }

    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(render);
  }, [filteredNodes, filteredEdges, selectedNodeId, hoveredNode, transform]);

  // Handle Resize and Canvas DPI setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpi = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpi;
      canvas.height = rect.height * dpi;
    };

    resize();
    window.addEventListener('resize', resize);
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render]);

  // Screen Coordinates to Graph Coordinates Helper
  const screenToGraph = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const clickX = screenX - rect.left;
      const clickY = screenY - rect.top;

      const graphX = (clickX - width / 2 - transform.x) / transform.scale;
      const graphY = (clickY - height / 2 - transform.y) / transform.scale;
      return { x: graphX, y: graphY };
    },
    [transform]
  );

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const clickedNode = filteredNodes.find((n) => {
      const dx = n.x - x;
      const dy = n.y - y;
      return dx * dx + dy * dy < 25 * 25;
    });

    if (clickedNode) {
      isDraggingRef.current = true;
      dragNodeRef.current = clickedNode;
      clickedNode.isPinned = true;
      onSelectNode(clickedNode);
    } else {
      isPanningRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToGraph(e.clientX, e.clientY);

    if (isDraggingRef.current && dragNodeRef.current) {
      dragNodeRef.current.x = x;
      dragNodeRef.current.y = y;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else {
      const hit = filteredNodes.find((n) => {
        const dx = n.x - x;
        const dy = n.y - y;
        return dx * dx + dy * dy < 25 * 25;
      });
      setHoveredNode(hit || null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    dragNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3.5, prev.scale * zoomFactor)),
    }));
  };

  const handleResetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    nodes.forEach((n) => {
      n.isPinned = false;
    });
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-canvas">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas Quick Controls & Legend */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={handleResetView}
          className="px-2.5 py-1 rounded-md bg-canvas-overlay/90 backdrop-blur border border-border-subtle text-[11px] font-mono text-text-secondary hover:text-text-primary hover:border-signal/50 transition-colors shadow-sm"
        >
          Reset View
        </button>
        <span className="text-[10px] font-mono text-text-muted bg-canvas-overlay/80 px-2 py-1 rounded border border-border-subtle/50">
          Scale: {transform.scale.toFixed(1)}x • Nodes: {filteredNodes.length}
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2.5 z-10 text-[10px] font-mono bg-canvas-overlay/90 backdrop-blur px-3 py-1.5 rounded-lg border border-border-subtle">
        <span className="flex items-center gap-1 text-text-secondary">
          <span className="size-2 rounded-full bg-signal" /> Account
        </span>
        <span className="flex items-center gap-1 text-purple-400">
          <span className="size-2 rounded-full bg-purple-500" /> Device (IMEI)
        </span>
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="size-2 rounded-full bg-cyan-500" /> BVN
        </span>
        <span className="flex items-center gap-1 text-risk">
          <span className="size-2 rounded-full bg-risk" /> High Risk / Loop
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <span className="size-2 rounded-full bg-red-600 animate-pulse" /> PND Frozen
        </span>
      </div>
    </div>
  );
};
