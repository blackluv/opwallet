import { useState } from 'react';

import { KEYRING_TYPE } from '@/shared/constant';
import { Button, Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import WebsiteBar from '@/ui/components/WebsiteBar';
import { useCurrentAccount } from '@/ui/state/accounts/hooks';
import { useApproval } from '@/ui/utils';

import KeystoneSignScreen from '../../Wallet/KeystoneSignScreen';

interface Props {
  params: {
    data: {
      interactionParameters: any;
    };
    session: {
      origin: string;
      icon: string;
      name: string;
    };
  };
}
export default function SignText({ params: { data, session } }: Props) {
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const account = useCurrentAccount();
  const [isKeystoneSigning, setIsKeystoneSigning] = useState(false);

  const handleCancel = () => {
    rejectApproval();
  };

  const handleConfirm = () => {
    if (account.type === KEYRING_TYPE.KeystoneKeyring) {
      setIsKeystoneSigning(true);
      return;
    }
    resolveApproval();
  };
  if (isKeystoneSigning) {
    return (
      <KeystoneSignScreen
        type={'msg'}
        data={data.interactionParameters}
        onSuccess={({ signature }) => {
          resolveApproval({ signature });
        }}
        onBack={() => {
          setIsKeystoneSigning(false);
        }}
      />
    );
  }
  return (
    <Layout>
      <Content>
        <Header>
          <WebsiteBar session={session} />
        </Header>
        <Column>
          <Text text="Signature request" preset="title-bold" textCenter mt="lg" />
          <Text
            text="Only sign this message if you fully understand the content and trust the requesting site."
            preset="sub"
            textCenter
            mt="lg"
          />
          <Text text="You are signing:" textCenter mt="lg" />

          <Card>
            <div
              style={{
                userSelect: 'text',
                maxHeight: 384,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                flexWrap: 'wrap'
              }}>
              {'OPNet priority fee:' + data.interactionParameters.priorityFee}
            </div>
          </Card>
        </Column>
      </Content>

      <Footer>
        <Row full>
          <Button text="Reject" full preset="default" onClick={handleCancel} />
          <Button text="Sign" full preset="primary" onClick={handleConfirm} />
        </Row>
      </Footer>
    </Layout>
  );
}
