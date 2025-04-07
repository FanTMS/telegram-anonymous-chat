import React from 'react';
import { Link } from 'react-router-dom';
import { getAppUrl, getPublicUrl } from '../utils/pathUtils';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f8f9fa;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  width: 40px;
  height: 40px;
  margin-right: 10px;
`;

const LogoText = styled.span`
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
`;

const Header = () => {
    return (
        <HeaderContainer>
            <LogoContainer>
                <Link to={getAppUrl('/')}>
                    <LogoImage src={getPublicUrl('/logo192.png')} alt="Logo" />
                    <LogoText>Анонимный чат</LogoText>
                </Link>
            </LogoContainer>
            {/* Additional header content can be added here */}
        </HeaderContainer>
    );
};

export default Header;