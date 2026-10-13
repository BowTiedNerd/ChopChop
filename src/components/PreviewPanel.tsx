import { useEffect, useRef } from 'react';
import { BoardDesign } from '../types';
import { TopView } from './TopView';
import { ThreeView } from './ThreeView';

interface PreviewPanelProps {
  design: BoardDesign;
}

export function PreviewPanel({ design }: PreviewPanelProps) {
  return (
    <div className="preview-section">
      <h2>Preview</h2>

      <div className="preview-title">Top View</div>
      <TopView design={design} />

      <div className="preview-title" style={{ marginTop: '2rem' }}>
        3D View
      </div>
      <ThreeView design={design} />
    </div>
  );
}
