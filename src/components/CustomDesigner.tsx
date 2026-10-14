import { useState } from 'react';
import { WoodSpecies } from '../types';
import { 
  CustomDesign,
  createDefaultCustomDesign,
  generateCustomPattern,
  calculateCustomCutList,
  generateCustomSteps
} from '../lib/customDesigner';
import { WOOD_SPECIES } from '../lib/defaults';

interface CustomDesignerProps {
  onApply: (design: CustomDesign) => void;
}

export function CustomDesigner({ onApply }: CustomDesignerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [design, setDesign] = useState<CustomDesign>(createDefaultCustomDesign(WOOD_SPECIES));
  const [preview, setPreview] = useState(false);

  const updateFirstPass = (field: string, value: number | WoodSpecies[]) => {
    setDesign({
      ...design,
      firstPass: {
        ...design.firstPass,
        [field]: value,
      },
    });
  };

  const updateSecondPass = (field: string, value: number | string) => {
    setDesign({
      ...design,
      secondPass: {
        ...design.secondPass,
        [field]: value,
      },
    });
  };

  const handlePreview = () => {
    const pattern = generateCustomPattern(design);
    console.log('Custom pattern:', pattern);
    setPreview(true);
  };

  const handleApply = () => {
    onApply(design);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div style={{ marginTop: '1rem' }}>
        <button 
          className="secondary" 
          onClick={() => setIsOpen(true)}
          style={{ width: '100%' }}
        >
          Open Custom Designer (Second Slice-and-Reglue)
        </button>
      </div>
    );
  }

  const cutList = calculateCustomCutList(design);
  const steps = generateCustomSteps(design);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'auto',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: '2rem',
      }}>
        <h2>Custom Designer</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Create custom patterns with a second slice-and-reglue pass
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* First Pass */}
          <div>
            <h3 style={{ borderBottom: '2px solid #5B3A29', paddingBottom: '0.5rem' }}>
              First Pass: Initial Glue-Up
            </h3>
            
            <div className="form-group">
              <label>Strip Width (mm)</label>
              <input
                type="number"
                value={design.firstPass.stripWidth}
                onChange={(e) => updateFirstPass('stripWidth', parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Strip Thickness (mm)</label>
              <input
                type="number"
                value={design.firstPass.stripThickness}
                onChange={(e) => updateFirstPass('stripThickness', parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Strip Length (mm)</label>
              <input
                type="number"
                value={design.firstPass.stripLength}
                onChange={(e) => updateFirstPass('stripLength', parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Number of Strips</label>
              <input
                type="number"
                value={design.firstPass.stripCount}
                onChange={(e) => updateFirstPass('stripCount', parseInt(e.target.value))}
                min="2"
              />
            </div>

            <div className="form-group">
              <label>Species (select 2)</label>
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
                      border: design.firstPass.species.some(s => s.name === species.name) 
                        ? '2px solid #333' 
                        : '1px solid #ccc',
                      fontSize: '0.9rem',
                    }}
                    onClick={() => {
                      const hasSpecies = design.firstPass.species.some(s => s.name === species.name);
                      if (hasSpecies) {
                        updateFirstPass('species', design.firstPass.species.filter(s => s.name !== species.name));
                      } else if (design.firstPass.species.length < 2) {
                        updateFirstPass('species', [...design.firstPass.species, species]);
                      }
                    }}
                  >
                    {species.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Second Pass */}
          <div>
            <h3 style={{ borderBottom: '2px solid #5B3A29', paddingBottom: '0.5rem' }}>
              Second Pass: Slice & Rearrange
            </h3>

            <div className="form-group">
              <label>Slice Angle (degrees)</label>
              <input
                type="number"
                value={design.secondPass.sliceAngle}
                onChange={(e) => updateSecondPass('sliceAngle', parseFloat(e.target.value))}
                min="0"
                max="45"
                step="5"
              />
              <small style={{ color: '#666' }}>0° = perpendicular, 45° = diagonal</small>
            </div>

            <div className="form-group">
              <label>Slice Width (mm)</label>
              <input
                type="number"
                value={design.secondPass.sliceWidth}
                onChange={(e) => updateSecondPass('sliceWidth', parseFloat(e.target.value))}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label>Arrangement Pattern</label>
              <select
                value={design.secondPass.arrangement}
                onChange={(e) => updateSecondPass('arrangement', e.target.value)}
              >
                <option value="straight">Straight (no flip)</option>
                <option value="flipped">Flipped (every other)</option>
                <option value="alternating">Alternating offset</option>
                <option value="mirror">Mirror from center</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rotation (degrees)</label>
              <select
                value={design.secondPass.rotation}
                onChange={(e) => updateSecondPass('rotation', parseInt(e.target.value))}
              >
                <option value="0">0° (no rotation)</option>
                <option value="90">90° (quarter turn)</option>
                <option value="180">180° (half turn)</option>
                <option value="270">270° (three-quarter turn)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Final Dimensions */}
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ borderBottom: '2px solid #5B3A29', paddingBottom: '0.5rem' }}>
            Final Dimensions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Width (mm)</label>
              <input
                type="number"
                value={design.finalWidth}
                onChange={(e) => setDesign({ ...design, finalWidth: parseFloat(e.target.value) })}
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Length (mm)</label>
              <input
                type="number"
                value={design.finalLength}
                onChange={(e) => setDesign({ ...design, finalLength: parseFloat(e.target.value) })}
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label>Thickness (mm)</label>
              <input
                type="number"
                value={design.finalThickness}
                onChange={(e) => setDesign({ ...design, finalThickness: parseFloat(e.target.value) })}
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Cut List Preview */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
          <h4>Cut List Summary</h4>
          <div style={{ fontSize: '0.9rem' }}>
            <strong>First Pass Strips:</strong>
            <ul style={{ marginLeft: '1.5rem' }}>
              {cutList.firstPassStrips.map((strip, i) => (
                <li key={i}>
                  {strip.count}× {strip.species} strips ({strip.dimensions})
                </li>
              ))}
            </ul>
            <strong>Second Pass:</strong>
            <ul style={{ marginLeft: '1.5rem' }}>
              {cutList.secondPassSlices.map((slice, i) => (
                <li key={i}>
                  {slice.description} = {slice.count} slices
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Preview Steps */}
        {preview && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}>
            <h4>Build Steps</h4>
            <div style={{ fontSize: '0.9rem' }}>
              {steps.map((step) => (
                <div key={step.stepNumber} style={{ marginBottom: '0.5rem' }}>
                  <strong>Step {step.stepNumber}:</strong> {step.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="button-group" style={{ marginTop: '1.5rem' }}>
          <button className="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </button>
          <button className="secondary" onClick={handlePreview}>
            Preview Steps
          </button>
          <button className="primary" onClick={handleApply}>
            Apply Custom Design
          </button>
        </div>
      </div>
    </div>
  );
}
