import styled from 'styled-components';

export const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
`;

export const FormTitle = styled.h1`
  font-size: 20px;
  margin-bottom: 16px;
  text-align: center;
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 6px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 6px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

export const Checkbox = styled.input`
  margin-right: 10px;
`;

export const ErrorMessage = styled.div`
  color: var(--tg-theme-destructive-color, #e53935);
  font-size: 14px;
  margin-top: 6px;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;
`;

export const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  
  background-color: ${props => props.secondary 
    ? 'var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2))' 
    : 'var(--tg-theme-button-color, #2481cc)'};
  color: ${props => props.secondary 
    ? 'var(--tg-theme-text-color, #000)' 
    : 'var(--tg-theme-button-text-color, #fff)'};
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

export const TagInput = styled.input`
  width: 120px;
  padding: 6px 10px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

export const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border-radius: 4px;
  font-size: 14px;
  gap: 6px;
`;

export const RemoveTagButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;
