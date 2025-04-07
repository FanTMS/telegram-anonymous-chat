import styled from 'styled-components';

export const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  padding-bottom: calc(16px + var(--safe-area-inset-bottom, 0px));
  animation: fadeIn 0.3s ease-out;
  
  @media (min-width: 481px) {
    max-width: 480px;
    padding: 24px;
  }
`;

export const FormTitle = styled.h1`
  font-size: 22px;
  margin-bottom: 24px;
  text-align: center;
  font-weight: 600;
  color: var(--tg-theme-text-color, #000);
`;

export const FormGroup = styled.div`
  margin-bottom: 20px;
  animation: slideUp 0.3s ease-out;
  animation-fill-mode: both;
  
  &:nth-child(2) { animation-delay: 0.05s; }
  &:nth-child(3) { animation-delay: 0.1s; }
  &:nth-child(4) { animation-delay: 0.15s; }
  &:nth-child(5) { animation-delay: 0.2s; }
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 15px;
  color: var(--tg-theme-text-color, #000);
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 10px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
    box-shadow: 0 0 0 2px rgba(var(--tg-theme-button-color-rgb, 36, 129, 204), 0.2);
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 10px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);
  min-height: 120px;
  resize: vertical;
  font-size: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
    box-shadow: 0 0 0 2px rgba(var(--tg-theme-button-color-rgb, 36, 129, 204), 0.2);
  }
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
`;

export const Checkbox = styled.input`
  margin-right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

export const ErrorMessage = styled.div`
  color: var(--tg-theme-destructive-color, #e53935);
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  
  &::before {
    content: "⚠️";
    margin-right: 6px;
    font-size: 12px;
  }
`;

export const ButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  animation: slideUp 0.3s ease-out;
  animation-delay: 0.25s;
  animation-fill-mode: both;
`;

export const Button = styled.button`
  flex: 1;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  text-align: center;
  font-size: 16px;
  transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
  position: relative;
  overflow: hidden;
  
  background-color: ${props => props.secondary
    ? 'var(--tg-theme-secondary-bg-color, #f0f0f0)'
    : 'var(--tg-theme-button-color, #2481cc)'};
  color: ${props => props.secondary
    ? 'var(--tg-theme-text-color, #000)'
    : 'var(--tg-theme-button-text-color, #fff)'};
  
  ${props => props.secondary && `
    border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  `}
  
  &:active {
    transform: translateY(1px);
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, #fff 10%, transparent 10.01%);
    background-repeat: no-repeat;
    background-position: 50%;
    transform: scale(10, 10);
    opacity: 0;
    transition: transform 0.3s, opacity 0.8s;
  }
  
  &:active::after {
    transform: scale(0, 0);
    opacity: 0.3;
    transition: 0s;
  }
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

export const TagInput = styled.input`
  width: calc(100% - 100px);
  padding: 12px 14px;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 10px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  font-size: 15px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
    box-shadow: 0 0 0 2px rgba(var(--tg-theme-button-color-rgb, 36, 129, 204), 0.2);
  }
`;

export const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border-radius: 20px;
  font-size: 14px;
  gap: 8px;
  animation: fadeIn 0.2s ease-out;
  user-select: none;
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
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  
  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

// Animation keyframes
export const Animations = styled.div`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
