import React from 'react';
import PhoneInputBase from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function PhoneInput({ value, onChange, defaultCountry = 'IN', placeholder = 'Enter phone number', testId = 'phone-input', ...props }) {
  return (
    <div className="phone-input-wrap" data-testid={testId}>
      <PhoneInputBase
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
