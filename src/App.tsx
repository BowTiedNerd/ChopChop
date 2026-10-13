import { useState } from 'react';
import './App.css';
import { BoardDesign } from './types';
import { createDefaultBoard } from './lib/defaults';
import { validateBoard } from './lib/validation';
import { DesignEditor } from './components/DesignEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { LumberPlanner } from './components/LumberPlanner';
import { PdfGenerator } from './lib/pdf';

function App() {
  const [design, setDesign] = useState<BoardDesign>(createDefaultBoard());
  const [validation, setValidation] = useState(validateBoard(createDefaultBoard()));

  const handleDesignChange = (newDesign: BoardDesign) => {
    setDesign(newDesign);
    const validationResult = validateBoard(newDesign);
    setValidation(validationResult);
  };

  const handleExportPDF = () => {
    if (!validation.valid) {
      alert('Please fix validation errors before exporting');
      return;
    }

    const generator = new PdfGenerator(design);
    
    // Generate sample cut list
    const cutList = [
      {
        part: 'Board strips',
        quantity: 20,
        width: 25.4,
        thickness: 38.1,
        length: 406.4,
        species: 'Walnut',
      },
    ];

    // Generate sample steps
    const steps = [
      {
        stepNumber: 1,
        title: 'Mill rough stock',
        description: 'Joint edges on the jointer, then plane to final thickness.',
        settings: {
          'Planer depth': '38.1 mm (1.5")',
          'Feed rate': 'Slow',
        },
        safetyBanners: [
          'WARNING: Keep hands away from cutterhead. Use push blocks.',
        ],
      },
    ];

    const pdf = generator.generateCutSheet(cutList, steps);
    pdf.save(`chopchop-${design.style}-${Date.now()}.pdf`);
  };

  return (
    <div className="app-container">
      <header>
        <h1>ChopChop Cutting Board Designer</h1>
        <p>Design and generate cutting board plans with step-by-step instructions</p>
      </header>

      {!validation.valid && (
        <div className="validation-errors">
          <h3>Validation Errors</h3>
          <ul>
            {validation.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="validation-warnings">
          <h3>Warnings</h3>
          <ul>
            {validation.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-grid">
        <DesignEditor design={design} onChange={handleDesignChange} />
        <PreviewPanel design={design} />
      </div>

      <LumberPlanner design={design} />

      <div className="button-group">
        <button className="primary" onClick={handleExportPDF} disabled={!validation.valid}>
          Export Cut Sheet PDF
        </button>
        <button className="secondary">
          Export Mill Plan PDF
        </button>
      </div>
    </div>
  );
}

export default App;
