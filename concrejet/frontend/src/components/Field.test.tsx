import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field, Input } from './Field';

describe('Field', () => {
  it('associa label ao input via htmlFor/id', () => {
    render(
      <Field label="E-mail" required>
        <Input type="email" />
      </Field>,
    );

    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('type', 'email');
  });
});
