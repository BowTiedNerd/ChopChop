import { useState } from 'react';
import { BoardDesign } from '../types';
import { 
  StockBoard, 
  calculateRequiredParts, 
  optimizeCuttingPlan,
  createDefaultStock,
  OptimizationResult
} from '../lib/lumberPlanner';
import { formatDimension } from '../utils/format';

interface LumberPlannerProps {
  design: BoardDesign;
}

export function LumberPlanner({ design }: LumberPlannerProps) {
  const [stock, setStock] = useState<StockBoard[]>(createDefaultStock());
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);

  const handleOptimize = () => {
    const requiredParts = calculateRequiredParts(design);
    const result = optimizeCuttingPlan(requiredParts, stock);
    setOptimization(result);
  };

  const addStockBoard = () => {
    const newBoard: StockBoard = {
      id: `stock-${Date.now()}`,
      species: design.species[0]?.name || 'Walnut',
      width: 150,
      thickness: 50,
      length: 2400,
      quantity: 1,
      pricePerBF: null,
    };
    setStock([...stock, newBoard]);
  };

  const updateStock = (id: string, field: keyof StockBoard, value: string | number) => {
    setStock(stock.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStock = (id: string) => {
    setStock(stock.filter(s => s.id !== id));
  };

  return (
    <div className="editor-section" style={{ marginTop: '2rem' }}>
      <h2>Lumber Planner</h2>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Optimize cutting from your available stock. Prices are your own entries.
      </p>

      <h3>Available Stock</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        {stock.map((board) => (
          <div key={board.id} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr 1fr 80px 80px',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            padding: '0.5rem',
            background: '#f9f9f9',
            borderRadius: '4px',
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Species</label>
              <input
                type="text"
                value={board.species}
                onChange={(e) => updateStock(board.id, 'species', e.target.value)}
                style={{ fontSize: '0.9rem', padding: '0.4rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Width (mm)</label>
              <input
                type="number"
                value={board.width}
                onChange={(e) => updateStock(board.id, 'width', parseFloat(e.target.value))}
                style={{ fontSize: '0.9rem', padding: '0.4rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Thickness (mm)</label>
              <input
                type="number"
                value={board.thickness}
                onChange={(e) => updateStock(board.id, 'thickness', parseFloat(e.target.value))}
                style={{ fontSize: '0.9rem', padding: '0.4rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Length (mm)</label>
              <input
                type="number"
                value={board.length}
                onChange={(e) => updateStock(board.id, 'length', parseFloat(e.target.value))}
                style={{ fontSize: '0.9rem', padding: '0.4rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem' }}>Qty</label>
              <input
                type="number"
                value={board.quantity}
                onChange={(e) => updateStock(board.id, 'quantity', parseInt(e.target.value))}
                style={{ fontSize: '0.9rem', padding: '0.4rem' }}
                min="1"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => removeStock(board.id)}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.4rem',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="button-group">
        <button className="secondary" onClick={addStockBoard}>
          Add Stock Board
        </button>
        <button className="primary" onClick={handleOptimize}>
          Optimize Cutting Plan
        </button>
      </div>

      {optimization && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Optimization Results</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}>
            <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Utilization</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {optimization.utilizationPercentage.toFixed(1)}%
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#fff3e0', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Waste</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {optimization.totalWaste.toFixed(1)}%
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Boards Used</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {optimization.totalStock}
              </div>
            </div>
          </div>

          <h4>Cut List</h4>
          <div style={{ 
            overflowX: 'auto',
            marginBottom: '1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Part</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Qty</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Width</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Thick</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Length</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Species</th>
                </tr>
              </thead>
              <tbody>
                {optimization.cutList.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '0.5rem' }}>{item.part}</td>
                    <td style={{ padding: '0.5rem' }}>{item.quantity}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDimension(item.width, design.unitSystem)}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDimension(item.thickness, design.unitSystem)}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDimension(item.length, design.unitSystem)}</td>
                    <td style={{ padding: '0.5rem' }}>{item.species}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Milling Steps</h4>
          <div style={{ marginBottom: '1rem' }}>
            {optimization.millingSteps.map((step) => (
              <div key={step.stepNumber} style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                background: '#f9f9f9',
                borderRadius: '4px',
                borderLeft: '4px solid #5B3A29',
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Step {step.stepNumber}: {step.operation}
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {step.description}
                </div>
                {Object.keys(step.settings).length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {Object.entries(step.settings).map(([key, value]) => (
                      <div key={key}>• {key}: {value}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
