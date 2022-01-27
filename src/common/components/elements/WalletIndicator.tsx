import { ButtonReset } from '@/common/styles/ButtonReset';
import { useWallet } from '@solana/wallet-adapter-react';
import styled from 'styled-components';
import { Copy } from '../icons/Copy';

const showFirstAndLastFour = (str: string, isLowerThanEight = str.length <= 8) =>
  isLowerThanEight ? str : `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;

export const WalletPill = () => {
  const { publicKey } = useWallet();

  const handleClick = () => {
    navigator.clipboard.writeText(publicKey?.toBase58() ?? 'DISCONNECTED');
  };

  return (
    <Container onClick={handleClick}>
      <WalletText>
        {publicKey ? showFirstAndLastFour(publicKey.toBase58()) : 'DISCONNECTED'}
        &nbsp;
        <Copy />
      </WalletText>
    </Container>
  );
};

export const WalletLabel = () => {
  const { publicKey, connected } = useWallet();
  return (
    <SmallWalletContainer>
      <ConnectionIndicator state={connected ? 'connected' : 'disconnected'} />
      <SmallWalletLabel>
        &nbsp;{publicKey ? showFirstAndLastFour(publicKey.toBase58()) : 'DISCONNECTED'}
      </SmallWalletLabel>
    </SmallWalletContainer>
  );
};

const ConnectionIndicator = styled.div<{ state: 'connected' | 'disconnected' | 'warn' }>`
  width: 8px;
  height: 8px;
  background: ${(props) => {
    switch (props.state) {
      case 'connected':
        return '#00d072';
      case 'disconnected':
        return '#d04200';
      case 'warn':
        return '#d0b100';
    }
  }};
  border-radius: 25px;
  content: '';
`;

const Container = styled.button`
  ${ButtonReset}
  background-color: #262626;
  border-radius: 500px;
  padding: 8px 12px;
`;

const SmallWalletContainer = styled.div`
  display: inline-flex;
  align-items: center;
`;

const SmallWalletLabel = styled.span`
  font-family: 'Space Mono', monospace;
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.02em;
  color: #a8a8a8;
`;

const WalletText = styled.span`
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  letter-spacing: 0.02em;
  color: #ffffff;
  align-items: center;
  justify-content: center;
  display: inline-flex;
`;
