// ScalarFields.js
import React from 'react';

export default function ScalarFields({ data, onChange, fields }) {
  return (
    <div className="scalar-fields">
      {fields.map(key => (
        <div key={key} className="field">
          <label>{key}</label>
          <input name={key} value={data[key] || ''} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}