import { Button, Column, Row, Text } from '@/ui/components';
import { useChangeAddressFlagCallback, useCurrentAccount } from '@/ui/state/accounts/hooks';
import { AddressFlagType } from '@/shared/constant';
import { checkAddressFlag } from '@/shared/utils';
import { fontSizes } from '@/ui/theme/font';
import { colors } from '@/ui/theme/colors';
import { useState } from 'react';
import { EnableAtomicalsPopover } from '@/ui/components/EnableAtomicalsPopover';

export default function ToEnableAtomicals() {
  const changeAddressFlag = useChangeAddressFlagCallback();
  const [isShowAlert, setIsShowAlert] = useState(false);
  const enableAtomicals = async () => {
    await changeAddressFlag(true, AddressFlagType.Is_Enable_Atomicals);
  };
  // const disableAtomicals = async () => {
  //   await changeAddressFlag(false, AddressFlagType.Is_Enable_Atomicals);
  // };
  return <>
    <Button onClick={()=>{
      setIsShowAlert(true);
    }}>
      Enable Atomicals
    </Button>
    {
      isShowAlert && <EnableAtomicalsPopover
        onClose={() => setIsShowAlert(false)}
        onConfirm={async () => {
          await enableAtomicals();
          setIsShowAlert(false);
        }}
      />
    }
  </>;
}