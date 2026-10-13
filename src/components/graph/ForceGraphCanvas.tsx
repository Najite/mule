import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { EntityNode, EntityEdge } from '@/lib/graph-engine/types';
import { DataProtectionService } from '@/lib/security/data-protection';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Circle,
  GitCommit,
} from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Transform states (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<EntityNode | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('pipeline');

  // Fund Journey Replay States
  const [isPlayingFlow, setIsPlayingFlow] = useState<boolean>(true);
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [flowSpeed, setFlowSpeed] = useState<number>(1); // 1x or 2x

  // Interactive drag state refs
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragNodeRef = useRef<EntityNode | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const particleOffsetRef = useRef<number>(0);
  const arrivalRippleRef = useRef<{ x: number; y: number; radius: number; alpha: number } | null>(null);
  const alphaRef = useRef<number>(0.0);

  // Persistent node positions map to ELIMINATE BOUNCING AND JITTER
  const persistentPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Filtered nodes based on risk threshold
  const filteredNodes = useMemo(() => {
    return nodes.filter(
      (n) => n.riskScore >= filterRiskThreshold || n.type === 'device' || n.type === 'bvn'
    );
  }, [nodes, filterRiskThreshold]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered and chronologically sorted edges for accurate Fund Flow Pipeline
  const filteredEdges = useMemo(() => {
    const list = edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    // Sort financial transfers chronologically by timestamp
    return [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [edges, filteredNodeIds]);

  // Financial edges only (excludes static device/bvn links) for fund journey replay
  const financialHops = useMemo(() => {
    return filteredEdges.filter(
      (e) => e.relationType !== 'AUTHENTICATED_ON' && e.relationType !== 'REGISTERED_TO_BVN'
    );
  }, [filteredEdges]);

  // Active Hop Edge
  const currentHopEdge = financialHops[activeHopIndex] || null;

  // Apply deterministic, stable layout when layoutMode changes or new nodes arrive
  const applyLayout = useCallback(
    (mode: LayoutMode, forceReset = false) => {
      const positions = persistentPosRef.current;
      const count = filteredNodes.length;
      if (count === 0) return;

      if (mode === 'pipeline') {
        // Chronological Stage Pipeline Layout: Inflow Source -> Layer 1 -> Layer 2 -> Consolidation
        // Compute in-degree / out-degree topological stage for each node
        const inDeg = new Map<string, number>();
        const outDeg = new Map<string, number>();
        filteredNodes.forEach((n) => {
          inDeg.set(n.id, 0);
          outDeg.set(n.id, 0);
        });
        filteredEdges.forEach((e) => {
          if (inDeg.has(e.target)) inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1);
          if (outDeg.has(e.source)) outDeg.set(e.source, (outDeg.get(e.source) || 0) + 1);
        });

        // Group into 4 distinct horizontal stages
        const stages: EntityNode[][] = [[], [], [], []];
        filteredNodes.forEach((n) => {
          const inCount = inDeg.get(n.id) || 0;
          const outCount = outDeg.get(n.id) || 0;
          if (n.type === 'device' || n.type === 'bvn') {
            stages[1].push(n); // Hardware / BVN layer in center top/bottom
          } else if (inCount === 0 && outCount > 0) {
            stages[0].push(n); // Pure Sources (Stage 0: Left)
          } else if (inCount > 0 && outCount === 0) {
            stages[3].push(n); // Pure Sinks / Cashout (Stage 3: Right)
          } else if (inCount >= outCount) {
            stages[2].push(n); // Layer 2 Consolidation (Stage 2: Mid-Right)
          } else {
            stages[1].push(n); // Layer 1 Transit Mules (Stage 1: Mid-Left)
          }
        });

        // Ensure non-empty stages if circular cycle exists
        if (stages[0].length === 0 && filteredNodes.length > 0) {
          filteredNodes.forEach((n, idx) => {
            stages[idx % 4].push(n);
          });
        }

        const stageX = [-260, -90, 90, 260];
        stages.forEach((stageNodes, stageIdx) => {
          const colX = stageX[stageIdx];
          const totalInStage = stageNodes.length;
          stageNodes.forEach((node, rowIdx) => {
            const spacing = Math.min(100, 360 / (totalInStage + 1));
            const y = (rowIdx - (totalInStage - 1) / 2) * spacing;
            node.x = colX;
            node.y = y;
            node.vx = 0;
            node.vy = 0;
            positions.set(node.id, { x: node.x, y: node.y });
          });
        });
        alphaRef.current = 0; // Completely settled immediately
      } else if (mode === 'ring') {
        // Syndicate Circular Layout: Evenly spaced circular ring showing clean clockwise routing
        const radiusX = Math.min(260, 90 + count * 20);
        const radiusY = Math.min(200, 70 + count * 15);
        filteredNodes.forEach((node, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          node.x = Math.cos(angle) * radiusX;
          node.y = Math.sin(angle) * radiusY;
          node.vx = 0;
          node.vy = 0;
          positions.set(node.id, { x: node.x, y: node.y });
        });
        alphaRef.current = 0; // Settled immediately
      } else if (mode === 'force') {
        // Organic force layout with fast settling
        filteredNodes.forEach((node, i) => {
          if (!positions.has(node.id) || forceReset) {
            const angle = (i / count) * Math.PI * 2;
            const r = 160;
            node.x = Math.cos(angle) * r;
            node.y = Math.sin(angle) * r;
            positions.set(node.id, { x: node.x, y: node.y });
          } else {
            const saved = positions.get(node.id)!;
            node.x = saved.x;
            node.y = saved.y;
          }
          node.vx = 0;
          node.vy = 0;
        });
        alphaRef.current = 0.4; // Soft cooling
      }
    },
    [filteredNodes, filteredEdges]
  );

  // Position nodes on initial load or layout switch without bouncing
  useEffect(() => {
    applyLayout(layoutMode, false);
  }, [layoutMode, applyLayout]);

  // Handle flow journey replay timer
  useEffect(() => {
    if (!isPlayingFlow || financialHops.length === 0) return;

    const interval = window.setInterval(() => {
      setActiveHopIndex((prev) => (prev + 1) % financialHops.length);
      particleOffsetRef.current = 0;
    }, 2800 / flowSpeed);

    return () => window.clearInterval(interval);
  }, [isPlayingFlow, financialHops.length, flowSpeed]);

  // Main Simulation & Rendering Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const nodeLookup = new Map(filteredNodes.map((n) => [n.id, n]));

    // 1. Soft Physics only if alpha > 0.01 (Force mode only)
    if (alphaRef.current > 0.01 && layoutMode === 'force') {
      const alpha = alphaRef.current;
      const repulsion = 2400 * alpha;
      const springLength = 120;
      const springK = 0.04 * alpha;
      const damping = 0.75; // Strong damping to kill jitter

      for (let i = 0; i < filteredNodes.length; i++) {
        const n1 = filteredNodes[i];
        for (let j = i + 1; j < filteredNodes.length; j++) {
          const n2 = filteredNodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 80;
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

      for (const edge of filteredEdges) {
        const s = nodeLookup.get(edge.source);
        const t = nodeLookup.get(edge.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - springLength;
          const force = displacement * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!s.isPinned) {
            s.vx += fx;
            s.vy += fy;
          }
          if (!t.isPinned) {
            t.vx += fx;
            t.vy += fy;
          }
        }
      }

      for (const n of filteredNodes) {
        if (!n.isPinned) {
          n.vx -= n.x * 0.01 * alpha;
          n.vy -= n.y * 0.01 * alpha;
          n.vx *= damping;
          n.vy *= damping;
          n.x += n.vx;
          n.y += n.vy;
          persistentPosRef.current.set(n.id, { x: n.x, y: n.y });
        }
      }
      alphaRef.current *= 0.92;
    }

    // 2. Clear Canvas & Background Grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Viewport transform
    ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Subtle dark grid
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

    // Flow packet animation offset tick (moves smoothly 0 -> 1)
    particleOffsetRef.current = (particleOffsetRef.current + 0.012 * flowSpeed) % 1;

    // Trigger arrival ripple when packet reaches near target (offset ~ 0.98)
    if (particleOffsetRef.current > 0.96 && currentHopEdge) {
      const targetNode = nodeLookup.get(currentHopEdge.target);
      if (targetNode && !arrivalRippleRef.current) {
        arrivalRippleRef.current = {
          x: targetNode.x,
          y: targetNode.y,
          radius: 20,
          alpha: 0.8,
        };
      }
    }

    // 3. Render Directed Edges with Actual Fund Flow
    for (let i = 0; i < filteredEdges.length; i++) {
      const edge = filteredEdges[i];
      const s = nodeLookup.get(edge.source);
      const t = nodeLookup.get(edge.target);
      if (!s || !t) continue;

      const isDeviceLink = edge.relationType === 'AUTHENTICATED_ON' || edge.typology === 'device_link';
      const isBvnLink = edge.relationType === 'REGISTERED_TO_BVN' || edge.typology === 'bvn_link';
      const isCurrentHop = currentHopEdge?.id === edge.id;
      const isHighRisk = edge.isHighRisk || edge.typology === 'circular';

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isDeviceLink) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      } else if (isBvnLink) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
      } else if (isCurrentHop) {
        // ACTIVE HOP: High-intensity glowing energy beam
        ctx.strokeStyle = isHighRisk ? '#EF4444' : '#F59E0B';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([]);
        ctx.shadowColor = isHighRisk ? '#EF4444' : '#F59E0B';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Standard financial flow edge
        ctx.strokeStyle = isHighRisk ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.25)';
        ctx.lineWidth = isHighRisk ? 2 : 1.5;
        ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Directed Arrowhead & Flow Packets for financial edges
      if (!isDeviceLink && !isBvnLink) {
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2;
        const angle = Math.atan2(t.y - s.y, t.x - s.x);
        const arrowSize = isCurrentHop ? 8 : 6;

        // Draw clear directional arrowhead
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize * 1.5, -arrowSize);
        ctx.lineTo(-arrowSize * 1.5, arrowSize);
        ctx.closePath();
        ctx.fillStyle = isCurrentHop ? '#FFFFFF' : isHighRisk ? '#EF4444' : '#F59E0B';
        ctx.fill();
        ctx.restore();

        // Edge Amount Badge (Displays e.g. "₦18.5M" centered with backdrop)
        const amtText = `₦${(edge.amount / 1_000_000).toFixed(1)}M`;
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(amtText).width;
        const badgeY = midY - 10;

        ctx.fillStyle = isCurrentHop ? 'rgba(15, 23, 42, 0.95)' : 'rgba(11, 15, 23, 0.85)';
        ctx.strokeStyle = isCurrentHop ? (isHighRisk ? '#EF4444' : '#F59E0B') : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - textWidth / 2 - 4, badgeY - 6, textWidth + 8, 12, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isCurrentHop ? (isHighRisk ? '#FCA5A5' : '#FDE68A') : '#94A3B8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(amtText, midX, badgeY);

        // ACTUAL TRAVELING FUND FLOW PACKET (Funds moving from Source -> Target!)
        // If current hop: bright pulsing packet carrying stolen funds
        if (!s.isFrozen && (isCurrentHop || isPlayingFlow)) {
          const progress = isCurrentHop ? particleOffsetRef.current : (particleOffsetRef.current + i * 0.25) % 1;
          const px = s.x + (t.x - s.x) * progress;
          const py = s.y + (t.y - s.y) * progress;

          // Packet glow and body
          ctx.beginPath();
          ctx.arc(px, py, isCurrentHop ? 4.5 : 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isCurrentHop ? '#FFFFFF' : isHighRisk ? '#EF4444' : '#FBBF24';
          ctx.shadowColor = isCurrentHop ? (isHighRisk ? '#EF4444' : '#F59E0B') : 'transparent';
          ctx.shadowBlur = isCurrentHop ? 8 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Render Arrival Ripple Effect (When money packet hits destination node!)
    if (arrivalRippleRef.current) {
      const rip = arrivalRippleRef.current;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${rip.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      rip.radius += 1.5;
      rip.alpha -= 0.05;
      if (rip.alpha <= 0) {
        arrivalRippleRef.current = null;
      }
    }

    // 4. Render Nodes (Stable, Pinned, Distinctly Color-Coded)
    for (const node of filteredNodes) {
      const isSelected = node.id === selectedNodeId;
      const isHovered = hoveredNode?.id === node.id;
      const isCritical = node.riskScore >= 75;
      const isDevice = node.type === 'device';
      const isBvn = node.type === 'bvn';
      const isFrozen = !!node.isFrozen;
      const isHopSource = currentHopEdge?.source === node.id;
      const isHopTarget = currentHopEdge?.target === node.id;
      const radius = isSelected ? 24 : isDevice ? 18 : 20;

      // Glow behind active hop sender or receiver
      if (isHopSource) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
      } else if (isHopTarget) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.fill();
      } else if (isFrozen) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fill();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isFrozen
        ? '#3A0D0D'
        : isHopSource
        ? '#450A0A'
        : isHopTarget
        ? '#064E3B'
        : isSelected
        ? '#F59E0B'
        : isCritical
        ? '#181C26'
        : isDevice
        ? '#2E1065'
        : isBvn
        ? '#083344'
        : '#12151D';
      ctx.fill();

      // Node Border
      ctx.lineWidth = isHopSource || isHopTarget ? 3 : isFrozen ? 3.5 : isSelected ? 3 : isCritical ? 2.5 : 1.5;
      ctx.strokeStyle = isFrozen
        ? '#EF4444'
        : isHopSource
        ? '#EF4444'
        : isHopTarget
        ? '#10B981'
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
        : 'rgba(255, 255, 255, 0.18)';
      ctx.stroke();

      // Node Inner Prefix
      ctx.fillStyle = isSelected ? '#08090C' : '#FFFFFF';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const typePrefix = isDevice ? 'DEV' : isBvn ? 'BVN' : 'ACC';
      ctx.fillText(typePrefix, node.x, node.y - 3);

      // Mini Risk / Status Label
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isFrozen ? '#FCA5A5' : isHopTarget ? '#6EE7B7' : isCritical ? '#EF4444' : '#94A3B8';
      ctx.fillText(isFrozen ? 'PND' : isHopSource ? 'OUT' : isHopTarget ? 'IN' : `${node.riskScore}`, node.x, node.y + 6);

      // Label below node (NDPA Masked if privacy mode is on)
      const displayLabel = privacyMaskingEnabled
        ? DataProtectionService.maskAccountNumber(node.id, true)
        : node.id;

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected ? '#F59E0B' : '#E2E8F0';
      ctx.fillText(displayLabel, node.x, node.y + radius + 12);
    }

    ctx.restore();
    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    filteredNodes,
    filteredEdges,
    selectedNodeId,
    hoveredNode,
    transform,
    layoutMode,
    currentHopEdge,
    isPlayingFlow,
    flowSpeed,
    privacyMaskingEnabled,
  ]);

  // Start rendering loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [render]);

  // Canvas Mouse & Interaction handlers (Pan, Drag node, Zoom)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    lastMousePosRef.current = { x: mouseX, y: mouseY };

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const worldX = (mouseX - width / 2 - transform.x) / transform.scale;
    const worldY = (mouseY - height / 2 - transform.y) / transform.scale;

    // Check node click
    const clicked = filteredNodes.find((n) => {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return dx * dx + dy * dy <= 22 * 22;
    });

    if (clicked) {
      isDraggingRef.current = true;
      dragNodeRef.current = clicked;
      clicked.isPinned = true;
      onSelectNode(clicked);
    } else {
      isPanningRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const worldX = (mouseX - width / 2 - transform.x) / transform.scale;
    const worldY = (mouseY - height / 2 - transform.y) / transform.scale;

    if (isDraggingRef.current && dragNodeRef.current) {
      dragNodeRef.current.x = worldX;
      dragNodeRef.current.y = worldY;
      dragNodeRef.current.vx = 0;
      dragNodeRef.current.vy = 0;
      persistentPosRef.current.set(dragNodeRef.current.id, { x: worldX, y: worldY });
    } else if (isPanningRef.current) {
      const dx = mouseX - lastMousePosRef.current.x;
      const dy = mouseY - lastMousePosRef.current.y;
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePosRef.current = { x: mouseX, y: mouseY };
    } else {
      const hovered = filteredNodes.find((n) => {
        const dx = n.x - worldX;
        const dy = n.y - worldY;
        return dx * dx + dy * dy <= 22 * 22;
      });
      setHoveredNode(hovered || null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    dragNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.4, prev.scale * zoomFactor)),
    }));
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070A0F] select-none">
      <canvas
        ref={canvasRef}
        width={1400}
        height={900}
        role="img"
        aria-label={`Interactive financial network graph with ${filteredNodes.length} active nodes and ${edges.length} payment paths.`}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
      />

      {/* Accessible Screen Reader Entity Navigation (better-accessibility) */}
      <div className="sr-only" aria-live="polite">
        <p>
          Financial Intelligence Graph contains {filteredNodes.length} entities.
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

      {/* TOP FLOATING CONTROLS: Layout Switcher & View Tools */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#0B0F17]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#1E293B] shadow-xl z-10 font-mono text-xs">
        <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-md border border-[#1E293B]">
          <button
            onClick={() => setLayoutMode('pipeline')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'pipeline'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Chronological Stage Pipeline: Stage 0 (Source) -> Layer 1 -> Layer 2 -> Sink"
          >
            <GitCommit className="size-3" />
            <span>Flow Pipeline</span>
          </button>

          <button
            onClick={() => setLayoutMode('ring')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'ring'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Syndicate Circular Flow: Clean geometric circular loop showing circular money laundering"
          >
            <Circle className="size-3" />
            <span>Syndicate Ring</span>
          </button>

          <button
            onClick={() => setLayoutMode('force')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              layoutMode === 'force'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Organic Network Force Graph"
          >
            <Layers className="size-3" />
            <span>Network</span>
          </button>
        </div>

        <div className="h-4 w-px bg-[#1E293B]" />

        {/* Zoom & Reset */}
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.15) }))}
          className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          onClick={() => setTransform((prev) => ({ ...prev, scale: Math.max(0.4, prev.scale * 0.85) }))}
          className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-white cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* BOTTOM FLOATING CONTROLLER: Chronological Fund Journey Step-by-Step Replay */}
      {financialHops.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 bg-[#0B0F17]/95 backdrop-blur-md px-5 py-3 rounded-xl border border-[#1E293B] shadow-2xl z-10 font-mono text-xs max-w-xl w-full">
          {/* Active Hop Detailed Description */}
          <div className="w-full flex items-center justify-between text-[11px] pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-slate-400">HOP {activeHopIndex + 1} OF {financialHops.length}:</span>
              {currentHopEdge && (
                <span className="text-white font-bold">
                  {privacyMaskingEnabled
                    ? DataProtectionService.maskAccountNumber(currentHopEdge.source, true)
                    : currentHopEdge.source}{' '}
                  <span className="text-amber-400">&rarr; ₦{(currentHopEdge.amount / 1_000_000).toFixed(1)}M ({currentHopEdge.rail}) &rarr;</span>{' '}
                  {privacyMaskingEnabled
                    ? DataProtectionService.maskAccountNumber(currentHopEdge.target, true)
                    : currentHopEdge.target}
                </span>
              )}
            </div>

            <button
              onClick={() => setFlowSpeed((prev) => (prev === 1 ? 2 : 1))}
              className="text-[10px] px-2 py-0.5 rounded bg-[#141B26] text-amber-300 border border-[#1E293B] hover:border-amber-500/40 cursor-pointer"
            >
              {flowSpeed}x SPEED
            </button>
          </div>

          {/* Player controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveHopIndex((prev) => (prev - 1 + financialHops.length) % financialHops.length);
                particleOffsetRef.current = 0;
              }}
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
              onClick={() => {
                setActiveHopIndex((prev) => (prev + 1) % financialHops.length);
                particleOffsetRef.current = 0;
              }}
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
