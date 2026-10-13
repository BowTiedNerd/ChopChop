import { BoardDesign, BoardStyle } from '../types';
import { STYLE_NAMES, WOOD_SPECIES } from '../lib/defaults';
import { inchText, metricText, mmToInches } from '../utils/format';
import { CustomDesigner } from './CustomDesigner';
import { CustomDesign } from '../lib/customDesigner';

interface DesignEditorProps {
  design: BoardDesign;
  onChange: (design: BoardDesign) => void;
}

export function DesignEditor({ design, onChange }: DesignEditorProps) {
  const updateDesign = (updates: Partial<BoardDesign>) => {
    onChange({ ...design, ...updates });
  };

  const updateDimensions = (key: string, value: number) => {
    onChange({
      ...design,
      dimensions: {
        ...design.dimensions,
        [key]: value,
      },
    });
  };

  const updateJuiceGroove = (key: string, value: number | boolean) => {
    onChange({
      ...design,
      juiceGroove: {
        ...design.juiceGroove,
        [key]: value,
      },
    });
  };

  const updateRubberFeet = (key: string, value: number | boolean) => {
    onChange({
      ...design,
      rubberFeet: {
        ...design.rubberFeet,
        [key]: value,
      },
    });
  };

  const updateHandles = (key: string, value: boolean | string) => {
    onChange({
      ...design,
      handles: {
        ...design.handles,
        [key]: value,
      },
    });
  };

  const formatDimDisplay = (mm: number): string => {
    if (design.unitSystem === 'metric') {
      return metricText(mm, 1);
    } else {
      return inchText(mmToInches(mm));
    }
  };

  const handleApplyCustomDesign = (_customDesign: CustomDesign) => {
    // Custom design applied - would update the board design
    // For now, just log it
    console.log('Custom design applied:', _customDesign);
    // In future: convert CustomDesign to BoardDesign pattern
  };

  return (
    <div className="editor-section">
      <h2>Design Editor</h2>

      <div className="form-group">
        <label htmlFor="style">Board Style</label>
        <select
          id="style"
          value={design.style}
          onChange={(e) => updateDesign({ style: e.target.value as BoardStyle })}
        >
          {Object.entries(STYLE_NAMES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="unitSystem">Unit System</label>
        <select
          id="unitSystem"
          value={design.unitSystem}
          onChange={(e) => updateDesign({ unitSystem: e.target.value as 'imperial' | 'metric' })}
        >
          <option value="imperial">Imperial (inches)</option>
          <option value="metric">Metric (mm)</option>
        </select>
      </div>

      <h3>Dimensions</h3>

      <div className="form-group">
        <label htmlFor="width">
          Width ({formatDimDisplay(design.dimensions.width)})
        </label>
        <input
          id="width"
          type="number"
          value={design.dimensions.width}
          onChange={(e) => updateDimensions('width', parseFloat(e.target.value))}
          step="0.1"
          min="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="length">
          Length ({formatDimDisplay(design.dimensions.length)})
        </label>
        <input
          id="length"
          type="number"
          value={design.dimensions.length}
          onChange={(e) => updateDimensions('length', parseFloat(e.target.value))}
          step="0.1"
          min="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="thickness">
          Thickness ({formatDimDisplay(design.dimensions.thickness)})
        </label>
        <input
          id="thickness"
          type="number"
          value={design.dimensions.thickness}
          onChange={(e) => updateDimensions('thickness', parseFloat(e.target.value))}
          step="0.1"
          min="0"
        />
      </div>

      <h3>Wood Species</h3>
      <div className="form-group">
        <label>Selected: {design.species.map(s => s.name).join(', ')}</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {WOOD_SPECIES.map((species) => (
            <div
              key={species.name}
              style={{
                padding: '0.5rem 1rem',
                background: species.color,
                color: species.name === 'Walnut' ? 'white' : 'black',
                borderRadius: '4px',
                cursor: 'pointer',
                border: design.species.some(s => s.name === species.name) ? '2px solid #333' : '1px solid #ccc',
              }}
              onClick={() => {
                const hasSpecies = design.species.some(s => s.name === species.name);
                if (hasSpecies) {
                  onChange({
                    ...design,
                    species: design.species.filter(s => s.name !== species.name),
                  });
                } else {
                  onChange({
                    ...design,
                    species: [...design.species, species],
                  });
                }
              }}
            >
              {species.name}
            </div>
          ))}
        </div>
      </div>

      <h3>Modifiers</h3>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={design.juiceGroove.enabled}
            onChange={(e) => updateJuiceGroove('enabled', e.target.checked)}
          />
          {' '}Juice Groove
        </label>
      </div>

      {design.juiceGroove.enabled && (
        <div style={{ marginLeft: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="grooveWidth">Groove Width (mm)</label>
            <input
              id="grooveWidth"
              type="number"
              value={design.juiceGroove.width}
              onChange={(e) => updateJuiceGroove('width', parseFloat(e.target.value))}
              step="0.1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="grooveDepth">Groove Depth (mm)</label>
            <input
              id="grooveDepth"
              type="number"
              value={design.juiceGroove.depth}
              onChange={(e) => updateJuiceGroove('depth', parseFloat(e.target.value))}
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={design.handles.enabled}
            onChange={(e) => updateHandles('enabled', e.target.checked)}
          />
          {' '}Handles
        </label>
      </div>

      {design.handles.enabled && (
        <div style={{ marginLeft: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="handleType">Handle Type</label>
            <select
              id="handleType"
              value={design.handles.type}
              onChange={(e) => updateHandles('type', e.target.value)}
            >
              <option value="handle">Handle</option>
              <option value="hand-hole">Hand Hole</option>
              <option value="hand-hole-slot">Hand Hole Slot</option>
            </select>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={design.rubberFeet.enabled}
            onChange={(e) => updateRubberFeet('enabled', e.target.checked)}
          />
          {' '}Rubber Feet
        </label>
      </div>

      {design.rubberFeet.enabled && (
        <div style={{ marginLeft: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="feetDiameter">Diameter (mm)</label>
            <input
              id="feetDiameter"
              type="number"
              value={design.rubberFeet.diameter}
              onChange={(e) => updateRubberFeet('diameter', parseFloat(e.target.value))}
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      <CustomDesigner onApply={handleApplyCustomDesign} />
    </div>
  );
}
