import React, { useState } from 'react';
import styled from 'styled-components';
import { getIndexCreationInstructions } from '../utils/firebaseIndexCreator';

const Container = styled.div`
  background-color: #fff3cd;
  border: 1px solid #ffecb5;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  color: #664d03;
  position: relative;
`;

const Title = styled.h3`
  margin-top: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const Content = styled.div`
  margin-top: 8px;
  max-height: ${props => (props.$expanded ? 'max-content' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  opacity: ${props => (props.$expanded ? '1' : '0')};
`;

const Button = styled.button`
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background-color: #0b5ed7;
  }
`;

const Icon = styled.span`
  margin-right: 8px;
  font-size: 18px;
`;

const IndexCreationHelper = ({ error }) => {
    const [expanded, setExpanded] = useState(false);

    if (!error || !(error.includes('индекс') || error.includes('index'))) {
        return null;
    }

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const handleCreateIndexManually = () => {
        window.open('https://console.firebase.google.com/project/_/firestore/indexes', '_blank');
    };

    return (
        <Container>
            <Title onClick={toggleExpanded}>
                <div>
                    <Icon>⚠️</Icon>
                    Требуется создание индекса в Firebase
                </div>
                <span>{expanded ? '▲' : '▼'}</span>
            </Title>

            <Content $expanded={expanded}>
                <div dangerouslySetInnerHTML={{ __html: getIndexCreationInstructions() }} />

                <Button onClick={handleCreateIndexManually}>
                    Перейти к созданию индексов вручную
                </Button>
            </Content>
        </Container>
    );
};

export default IndexCreationHelper;
