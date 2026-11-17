"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Highlighter,
  Loader2,
  Maximize2,
  Minimize2,
  Pen,
  Redo2,
  RotateCcw,
  Sparkles,
  Type,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConvertScriptPages, useSaveMarkedScript } from "@/hooks";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type ToolType = "pen" | "highlighter" | "tick" | "cross" | "text" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface PathAnnotation {
  type: "path";
  tool: "pen" | "highlighter" | "eraser";
  points: Point[];
  color: string;
  size: number;
}

interface StampAnnotation {
  type: "stamp";
  stamp: "tick" | "cross";
  x: number;
  y: number;
  color: string;
  size: number;
}

interface TextAnnotation {
  type: "text";
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
}

type Annotation = PathAnnotation | StampAnnotation | TextAnnotation;

interface PageData {
  imageUrl: string;
  annotations: Annotation[];
  undoStack: Annotation[][];
  redoStack: Annotation[][];
}

const COLORS = [
  { label: "Red", value: "#e11d48", bgClass: "bg-[#e11d48]" },
  { label: "Green", value: "#16a34a", bgClass: "bg-[#16a34a]" },
  { label: "Blue", value: "#2563eb", bgClass: "bg-[#2563eb]" },
  { label: "Black", value: "#0f172a", bgClass: "bg-[#0f172a]" },
];

const SIZES = [
  { label: "Fine", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Thick", value: 7 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  scriptUrl: string;
  scriptLabel?: string;
  studentName?: string;
  attemptId: string;
  initialScore?: number | null;
  initialFeedback?: string | null;
  isPublished?: boolean;
  onSaved: (markedUrl: string) => void;
};

export function OnlineScriptMarkerModal({
  open,
  onClose,
  scriptUrl,
  scriptLabel = "Student Script",
  studentName = "Student",
  attemptId,
  initialScore,
  initialFeedback,
  isPublished = false,
  onSaved,
}: Props) {
  const convertMutation = useConvertScriptPages();
  const saveMutation = useSaveMarkedScript();

  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Tools state
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#e11d48"); // Default Red teacher pen
  const [size, setSize] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Text insertion state
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState("");

  // Grade state
  const [marks, setMarks] = useState(
    initialScore != null && initialScore >= 0 ? String(initialScore) : ""
  );
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<Point[]>([]);

  // Load and convert script pages
  useEffect(() => {
    if (!open || !scriptUrl) return;
    setLoadingPages(true);
    setLoadError(null);
    setPages([]);
    setCurrentPage(0);
    setZoom(1);

    convertMutation
      .mutateAsync(scriptUrl)
      .then((res) => {
        if (!res.pages || res.pages.length === 0) {
          throw new Error("No pages could be extracted from this script.");
        }
        const initialPages: PageData[] = res.pages.map((url) => ({
          imageUrl: url,
          annotations: [],
          undoStack: [],
          redoStack: [],
        }));
        setPages(initialPages);
      })
      .catch((err) => {
        setLoadError((err as ApiError)?.message || "Failed to load script for marking.");
      })
      .finally(() => {
        setLoadingPages(false);
      });
  }, [open, scriptUrl]);

  // Current page data
  const page = pages[currentPage];

  // Redraw canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = page.imageUrl;
    img.onload = () => {
      // Set canvas dimension based on image
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Render annotations
      for (const ann of page.annotations) {
        if (ann.type === "path") {
          if (ann.points.length < 2) continue;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          if (ann.tool === "highlighter") {
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = ann.size * 6;
            ctx.globalAlpha = 0.35;
          } else {
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = ann.size;
            ctx.globalAlpha = 1.0;
          }
          ctx.stroke();
          ctx.restore();
        } else if (ann.type === "stamp") {
          ctx.save();
          ctx.strokeStyle = ann.color;
          ctx.fillStyle = ann.color;
          ctx.lineWidth = Math.max(3, ann.size * 1.5);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          const s = ann.size * 9;
          if (ann.stamp === "tick") {
            // Draw neat checkmark (✔)
            ctx.beginPath();
            ctx.moveTo(ann.x - s * 0.6, ann.y);
            ctx.lineTo(ann.x - s * 0.1, ann.y + s * 0.6);
            ctx.lineTo(ann.x + s * 0.8, ann.y - s * 0.6);
            ctx.stroke();
          } else {
            // Draw neat cross (✘)
            ctx.beginPath();
            ctx.moveTo(ann.x - s * 0.5, ann.y - s * 0.5);
            ctx.lineTo(ann.x + s * 0.5, ann.y + s * 0.5);
            ctx.moveTo(ann.x + s * 0.5, ann.y - s * 0.5);
            ctx.lineTo(ann.x - s * 0.5, ann.y + s * 0.5);
            ctx.stroke();
          }
          ctx.restore();
        } else if (ann.type === "text") {
          ctx.save();
          ctx.fillStyle = ann.color;
          ctx.font = `bold ${ann.fontSize}px sans-serif`;
          ctx.textBaseline = "top";
          // Add soft white backing for readability
          ctx.shadowColor = "white";
          ctx.shadowBlur = 4;
          ctx.fillText(ann.text, ann.x, ann.y);
          ctx.restore();
        }
      }
    };
  }, [page]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Coordinate conversion from viewport to canvas space
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const pushAnnotation = (ann: Annotation) => {
    setPages((prev) => {
      const copy = [...prev];
      const cur = copy[currentPage];
      if (!cur) return prev;
      const nextUndo = [...cur.undoStack, cur.annotations];
      copy[currentPage] = {
        ...cur,
        annotations: [...cur.annotations, ann],
        undoStack: nextUndo.slice(-30),
        redoStack: [],
      };
      return copy;
    });
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e && e.touches.length > 1) return; // ignore pinch
    const pt = getCanvasCoords(e);
    if (!pt) return;

    if (activeTool === "tick" || activeTool === "cross") {
      pushAnnotation({
        type: "stamp",
        stamp: activeTool,
        x: pt.x,
        y: pt.y,
        color: activeTool === "tick" ? (color === "#e11d48" ? "#16a34a" : color) : "#e11d48",
        size,
      });
      return;
    }

    if (activeTool === "text") {
      setTextInput(pt);
      setTextValue("");
      return;
    }

    isDrawingRef.current = true;
    currentPathRef.current = [pt];
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    currentPathRef.current.push(pt);

    // Live preview stroke directly on canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const points = currentPathRef.current;
    if (points.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "highlighter") {
      ctx.strokeStyle = color;
      ctx.lineWidth = size * 6;
      ctx.globalAlpha = 0.35;
    } else if (activeTool === "eraser") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = size * 5;
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.globalAlpha = 1.0;
    }
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = currentPathRef.current;
    if (points.length >= 2) {
      pushAnnotation({
        type: "path",
        tool: activeTool === "highlighter" ? "highlighter" : activeTool === "eraser" ? "eraser" : "pen",
        points,
        color: activeTool === "eraser" ? "#ffffff" : color,
        size,
      });
    }
    currentPathRef.current = [];
  };

  const handleAddText = () => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null);
      return;
    }
    pushAnnotation({
      type: "text",
      text: textValue.trim(),
      x: textInput.x,
      y: textInput.y,
      color,
      fontSize: Math.max(16, size * 6),
    });
    setTextInput(null);
    setTextValue("");
  };

  const handleUndo = () => {
    setPages((prev) => {
      const copy = [...prev];
      const cur = copy[currentPage];
      if (!cur || cur.undoStack.length === 0) return prev;
      const prevAnnotations = cur.undoStack[cur.undoStack.length - 1];
      const nextUndo = cur.undoStack.slice(0, -1);
      copy[currentPage] = {
        ...cur,
        annotations: prevAnnotations,
        undoStack: nextUndo,
        redoStack: [cur.annotations, ...cur.redoStack],
      };
      return copy;
    });
  };

  const handleRedo = () => {
    setPages((prev) => {
      const copy = [...prev];
      const cur = copy[currentPage];
      if (!cur || cur.redoStack.length === 0) return prev;
      const nextAnnotations = cur.redoStack[0];
      const nextRedo = cur.redoStack.slice(1);
      copy[currentPage] = {
        ...cur,
        annotations: nextAnnotations,
        undoStack: [...cur.undoStack, cur.annotations],
        redoStack: nextRedo,
      };
      return copy;
    });
  };

  const handleClearPage = () => {
    if (!page || page.annotations.length === 0) return;
    if (!window.confirm("Clear all markings on this page?")) return;
    pushAnnotation({
      type: "path",
      tool: "pen",
      points: [],
      color: "#000",
      size: 1,
    });
    setPages((prev) => {
      const copy = [...prev];
      copy[currentPage] = {
        ...copy[currentPage],
        annotations: [],
        undoStack: [...copy[currentPage].undoStack, copy[currentPage].annotations],
        redoStack: [],
      };
      return copy;
    });
  };

  // Export each page to image data URL
  const exportAllPages = async (): Promise<string[]> => {
    const exported: string[] = [];
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) throw new Error("Could not initialize rendering canvas");

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const p = pages[pIdx];
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = p.imageUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load page ${pIdx + 1}`));
      });

      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.drawImage(img, 0, 0);

      // Render annotations onto offscreen
      for (const ann of p.annotations) {
        if (ann.type === "path") {
          if (ann.points.length < 2) continue;
          offCtx.save();
          offCtx.beginPath();
          offCtx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            offCtx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          offCtx.lineCap = "round";
          offCtx.lineJoin = "round";
          if (ann.tool === "highlighter") {
            offCtx.strokeStyle = ann.color;
            offCtx.lineWidth = ann.size * 6;
            offCtx.globalAlpha = 0.35;
          } else {
            offCtx.strokeStyle = ann.color;
            offCtx.lineWidth = ann.size;
            offCtx.globalAlpha = 1.0;
          }
          offCtx.stroke();
          offCtx.restore();
        } else if (ann.type === "stamp") {
          offCtx.save();
          offCtx.strokeStyle = ann.color;
          offCtx.fillStyle = ann.color;
          offCtx.lineWidth = Math.max(3, ann.size * 1.5);
          offCtx.lineCap = "round";
          offCtx.lineJoin = "round";

          const s = ann.size * 9;
          if (ann.stamp === "tick") {
            offCtx.beginPath();
            offCtx.moveTo(ann.x - s * 0.6, ann.y);
            offCtx.lineTo(ann.x - s * 0.1, ann.y + s * 0.6);
            offCtx.lineTo(ann.x + s * 0.8, ann.y - s * 0.6);
            offCtx.stroke();
          } else {
            offCtx.beginPath();
            offCtx.moveTo(ann.x - s * 0.5, ann.y - s * 0.5);
            offCtx.lineTo(ann.x + s * 0.5, ann.y + s * 0.5);
            offCtx.moveTo(ann.x + s * 0.5, ann.y - s * 0.5);
            offCtx.lineTo(ann.x - s * 0.5, ann.y + s * 0.5);
            offCtx.stroke();
          }
          offCtx.restore();
        } else if (ann.type === "text") {
          offCtx.save();
          offCtx.fillStyle = ann.color;
          offCtx.font = `bold ${ann.fontSize}px sans-serif`;
          offCtx.textBaseline = "top";
          offCtx.shadowColor = "white";
          offCtx.shadowBlur = 4;
          offCtx.fillText(ann.text, ann.x, ann.y);
          offCtx.restore();
        }
      }

      exported.push(offscreen.toDataURL("image/png", 0.95));
    }

    return exported;
  };

  const handleSave = async (publish: boolean) => {
    setSaveError(null);
    let gradeVal: number | undefined;
    if (marks.trim()) {
      gradeVal = Number(marks.trim());
      if (Number.isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
        setSaveError("Marks must be between 0 and 100%");
        return;
      }
    } else if (publish) {
      setSaveError("Please enter marks (0–100%) before publishing.");
      return;
    }

    try {
      const pageImages = await exportAllPages();
      const res = await saveMutation.mutateAsync({
        attemptId,
        payload: {
          pages: pageImages,
          grade: gradeVal,
          feedback: feedback.trim() || undefined,
          publish,
        },
      });

      onSaved(res.markedFileUrl);
      onClose();
    } catch (err) {
      setSaveError((err as ApiError)?.message || "Failed to save marked script.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm">
      {/* Top Header Navigation Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Pen className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white sm:text-base">
              Online Script Marking: {studentName}
            </h3>
            <p className="text-xs text-slate-400">{scriptLabel}</p>
          </div>
        </div>

        {/* Page Switcher */}
        {pages.length > 0 ? (
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={currentPage <= 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="h-7 w-7 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-semibold text-slate-200">
              Page {currentPage + 1} of {pages.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={currentPage >= pages.length - 1}
              onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
              className="h-7 w-7 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {/* Zoom & Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={zoom <= 0.6}
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="h-7 w-7 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="px-1 text-xs font-medium text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={zoom >= 2.5}
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="h-7 w-7 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setZoom(1)}
              className="h-7 px-2 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Reset
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Workspace (Tools Sidebar + Canvas Viewport + Marks Panel) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="flex w-16 shrink-0 flex-col items-center gap-3 border-r border-slate-800 bg-slate-950 p-2 text-white">
          {/* Tool selectors */}
          <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-2">
            <button
              type="button"
              title="Red Teacher Pen"
              onClick={() => setActiveTool("pen")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                activeTool === "pen"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Pen className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Highlighter"
              onClick={() => setActiveTool("highlighter")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                activeTool === "highlighter"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Highlighter className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Tick Stamp (✔)"
              onClick={() => setActiveTool("tick")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-emerald-400 transition",
                activeTool === "tick"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "hover:bg-slate-800 hover:text-emerald-300"
              )}
            >
              <Check className="h-5 w-5 stroke-[3]" />
            </button>

            <button
              type="button"
              title="Cross Stamp (✘)"
              onClick={() => setActiveTool("cross")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-rose-400 transition",
                activeTool === "cross"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "hover:bg-slate-800 hover:text-rose-300"
              )}
            >
              <X className="h-5 w-5 stroke-[3]" />
            </button>

            <button
              type="button"
              title="Text / Marks (+1, +2)"
              onClick={() => setActiveTool("text")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                activeTool === "text"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Type className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Eraser"
              onClick={() => setActiveTool("eraser")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition",
                activeTool === "eraser"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>

          {/* Color Palettes */}
          <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-6 w-6 rounded-full transition",
                  c.bgClass,
                  color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-slate-950"
                )}
              />
            ))}
          </div>

          {/* Line Width */}
          <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-2">
            {SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.label}
                onClick={() => setSize(s.value)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition",
                  size === s.value ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: s.value * 2, height: s.value * 2 }}
                />
              </button>
            ))}
          </div>

          {/* History Undo / Redo / Clear */}
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              title="Undo"
              disabled={!page || page.undoStack.length === 0}
              onClick={handleUndo}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Redo"
              disabled={!page || page.redoStack.length === 0}
              onClick={handleRedo}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-30"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Clear page markings"
              disabled={!page || page.annotations.length === 0}
              onClick={handleClearPage}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 transition hover:bg-rose-950 hover:text-rose-200 disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Canvas Viewport */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto bg-slate-900 p-6 flex items-start justify-center"
        >
          {loadingPages ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Rendering script pages for in-browser marking…</p>
            </div>
          ) : loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-rose-400 text-center max-w-md">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-semibold">{loadError}</p>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : page ? (
            <div
              className="relative shadow-2xl transition-transform origin-top"
              style={{ transform: `scale(${zoom})` }}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "cursor-crosshair rounded-lg bg-white select-none touch-none",
                  activeTool === "text" && "cursor-text",
                  activeTool === "eraser" && "cursor-cell"
                )}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />

              {/* Inline Text Input Overlay */}
              {textInput ? (
                <div
                  className="absolute z-30 flex items-center gap-1 rounded-lg border border-primary bg-white p-1 shadow-lg"
                  style={{
                    left: textInput.x,
                    top: textInput.y,
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    value={textValue}
                    placeholder="Type mark e.g. +2"
                    onChange={(e) => setTextValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddText();
                      if (e.key === "Escape") setTextInput(null);
                    }}
                    className="h-8 w-32 rounded px-2 text-xs font-bold text-slate-900 outline-none"
                    style={{ color }}
                  />
                  <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={handleAddText}>
                    OK
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-slate-400 hover:text-slate-600"
                    onClick={() => setTextInput(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right Grading & Result Panel */}
        <div className="flex w-72 shrink-0 flex-col justify-between border-l border-slate-800 bg-slate-950 p-4 text-white">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Result &amp; Evaluation
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Markings will be baked into a checked PDF script for the student.
              </p>
            </div>

            {/* Marks Input */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase text-slate-300">
                Marks (0–100%)
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="85"
                className="border-slate-800 bg-slate-900 text-lg font-bold text-white placeholder:text-slate-600 focus:border-primary"
              />
            </label>

            {/* Feedback Input */}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase text-slate-300">
                Feedback for Student
              </span>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Write corrections, notes or encouragement for the student…"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            {saveError ? (
              <div className="flex items-start gap-2 rounded-xl border border-rose-800/50 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              disabled={saveMutation.isPending || loadingPages}
              onClick={() => void handleSave(true)}
              className="w-full bg-emerald-600 text-white font-semibold hover:bg-emerald-500 shadow-md shadow-emerald-700/20"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compiling &amp; Publishing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {isPublished ? "Save & Republish" : "Save & Publish Result"}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending || loadingPages}
              onClick={() => void handleSave(false)}
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Save Marked Script (Draft)
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={saveMutation.isPending}
              onClick={onClose}
              className="w-full text-xs text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
