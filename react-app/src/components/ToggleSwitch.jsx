import React from 'react';
import '../styles/_toggleswitch.css';

function ToggleSwitch({ label, checked, onChange }) {
    return (
        <div className="toggle-switch-container" onClick={() => onChange(!checked)}>
            <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                <input 
                    type="checkbox" 
                    checked={checked} 
                    onChange={() => onChange(!checked)} 
                />
                <span className="toggle-slider"></span>
            </label>
            <span className="toggle-switch-label">
                {label}
            </span>
        </div>
    );
}

export default ToggleSwitch; 