import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ADDRESS_TYPES } from '@/shared/constant';
import { AddressType } from '@/shared/types';
import { Button, Column, Content, Header, Input, Layout, Row, Text } from '@/ui/components';
import { useTools } from '@/ui/components/ActionComponent';
import { AddressTypeCard } from '@/ui/components/AddressTypeCard';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { TabBar } from '@/ui/components/TabBar';
import { satoshisToAmount, useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';
import { Wallet } from '@btc-vision/transaction';
import { getBitcoinLibJSNetwork } from '@/shared/web3/Web3API';
import { networks } from 'bitcoinjs-lib';

function Step1({
                   contextData,
                   updateContextData
               }: {
    contextData: ContextData;
    updateContextData: (params: UpdateContextDataParams) => void;
}) {
    const [wif, setWif] = useState('');
    const [disabled, setDisabled] = useState(true);
    const wallet = useWallet();
    useEffect(() => {
        setDisabled(true);

        if (!wif) {
            return;
        }

        setDisabled(false);
    }, [wif]);

    const onChange = (e) => {
        const val = e.target.value;
        setWif(val);
        updateContextData({ step1Completed: val });
    };

    const tools = useTools();

    const btnClick = async () => {
        const network = await wallet.getNetworkType();
        const bitcoinNetwork = getBitcoinLibJSNetwork(network);

        try {
            /*const _res = await wallet.createTmpKeyringWithPrivateKey(wif, AddressType.P2TR);
            if (_res.accounts.length == 0) {
                throw new Error('Invalid PrivateKey');
            }*/
            console.log('network', bitcoinNetwork);

            const address = Wallet.fromWif(contextData.wif, networks.bitcoin); //keyring.accounts[0].address;
            if (!address.p2tr) {
                throw new Error('Invalid PrivateKey');
            }
        } catch (e) {
            console.log(e);
            tools.toastError((e as Error).message);
            return;
        }
        updateContextData({
            wif,
            tabType: TabType.STEP2
        });
    };

    return (
        <Column gap="lg">
            <Text text="Private Key" textCenter preset="bold" />

            <Input
                placeholder={'WIF Private Key or Hex Private Key'}
                onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if ('Enter' == e.key) {
                        btnClick();
                    }
                }}
                onChange={onChange}
                autoFocus={true}
            />
            <FooterButtonContainer>
                <Button disabled={disabled} text="Continue" preset="primary" onClick={btnClick} />
            </FooterButtonContainer>
        </Column>
    );
}

function Step2({
                   contextData,
                   updateContextData
               }: {
    contextData: ContextData;
    updateContextData: (params: UpdateContextDataParams) => void;
}) {
    const wallet = useWallet();
    const tools = useTools();

    const hdPathOptions = useMemo(() => {
        return ADDRESS_TYPES.filter((v) => {
            if (v.displayIndex < 0) {
                return false;
            }
            if (v.isUnisatLegacy) {
                return false;
            }
            return true;
        })
            .sort((a, b) => a.displayIndex - b.displayIndex)
            .map((v) => {
                return {
                    label: v.name,
                    hdPath: v.hdPath,
                    addressType: v.value,
                    isUnisatLegacy: v.isUnisatLegacy
                };
            });
    }, [contextData]);

    const [previewAddresses, setPreviewAddresses] = useState<string[]>(hdPathOptions.map((v) => ''));

    const [addressAssets, setAddressAssets] = useState<{
        [key: string]: { total_btc: string; satoshis: number; total_inscription: number };
    }>({});

    const selfRef = useRef({
        maxSatoshis: 0,
        recommended: 0,
        count: 0,
        addressBalances: {}
    });
    const self = selfRef.current;
    const run = async () => {
        const addresses: string[] = [];
        const network = await wallet.getNetworkType();
        const bitcoinNetwork = getBitcoinLibJSNetwork(network);

        for (let i = 0; i < hdPathOptions.length; i++) {
            //const options = hdPathOptions[i];
            console.log('contextData', contextData);
            //const keyring = await wallet.createTmpKeyringWithPrivateKey(contextData.wif, options.addressType);
            const address = Wallet.fromWif(contextData.wif, bitcoinNetwork); //keyring.accounts[0].address;
            console.log(address);
            addresses.push(address.p2tr);
        }

        console.log(addresses);

        const balances = await wallet.getMultiAddressAssets(addresses.join(','));
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const balance = balances[i];
            const satoshis = balance.totalSatoshis;
            self.addressBalances[address] = {
                total_btc: satoshisToAmount(balance.totalSatoshis),
                satoshis,
                total_inscription: balance.inscriptionCount
            };
            if (satoshis > self.maxSatoshis) {
                self.maxSatoshis = satoshis;
                self.recommended = i;
            }

            updateContextData({ addressType: hdPathOptions[self.recommended].addressType });
            setAddressAssets(self.addressBalances);
        }
        setPreviewAddresses(addresses);
    };
    useEffect(() => {
        run();
    }, [contextData.wif]);

    const pathIndex = useMemo(() => {
        return hdPathOptions.findIndex((v) => v.addressType === contextData.addressType);
    }, [hdPathOptions, contextData.addressType]);

    const navigate = useNavigate();

    const onNext = async () => {
        try {
            await wallet.createKeyringWithPrivateKey(contextData.wif, contextData.addressType);
            navigate('MainScreen');
        } catch (e) {
            tools.toastError((e as any).message);
        }
    };
    return (
        <Column gap="lg">
            <Text text="Address Type" preset="bold" />

            <Text text="OP_NET is currently only compatible with Taproot (P2TR) addresses." color="red" />

            {hdPathOptions.map((item, index) => {
                const address = previewAddresses[index];
                const assets = addressAssets[address] || {
                    total_btc: '--',
                    satoshis: 0,
                    total_inscription: 0
                };
                const hasVault = assets.satoshis > 0;
                if (item.isUnisatLegacy && !hasVault) {
                    return null;
                }
                return (
                    <AddressTypeCard
                        key={index}
                        label={`${item.label}`}
                        address={address}
                        assets={assets}
                        checked={index == pathIndex}
                        onClick={() => {
                            updateContextData({ addressType: item.addressType });
                        }}
                    />
                );
            })}

            <FooterButtonContainer>
                <Button text="Coninue" preset="primary" onClick={onNext} />
            </FooterButtonContainer>
        </Column>
    );
}

enum TabType {
    STEP1 = 'STEP1',
    STEP2 = 'STEP2',
    STEP3 = 'STEP3'
}

interface ContextData {
    wif: string;
    addressType: AddressType;
    step1Completed: boolean;
    tabType: TabType;
}

interface UpdateContextDataParams {
    wif?: string;
    addressType?: AddressType;
    step1Completed?: boolean;
    tabType?: TabType;
}

export default function CreateSimpleWalletScreen() {
    const [contextData, setContextData] = useState<ContextData>({
        wif: '',
        addressType: AddressType.P2WPKH,
        step1Completed: false,
        tabType: TabType.STEP1
    });

    const updateContextData = useCallback(
        (params: UpdateContextDataParams) => {
            setContextData(Object.assign({}, contextData, params));
        },
        [contextData, setContextData]
    );

    const items = [
        {
            key: TabType.STEP1,
            label: 'Step 1',
            children: <Step1 contextData={contextData} updateContextData={updateContextData} />
        },
        {
            key: TabType.STEP2,
            label: 'Step 2',
            children: <Step2 contextData={contextData} updateContextData={updateContextData} />
        }
    ];

    const renderChildren = items.find((v) => v.key == contextData.tabType)?.children;

    return (
        <Layout>
            <Header
                onBack={() => {
                    window.history.go(-1);
                }}
                title="Create Single Wallet"
            />
            <Content>
                <Row justifyCenter>
                    <TabBar
                        progressEnabled
                        defaultActiveKey={TabType.STEP1}
                        items={items}
                        activeKey={contextData.tabType}
                        onTabClick={(key) => {
                            const toTabType = key as TabType;
                            if (toTabType === TabType.STEP2) {
                                if (!contextData.step1Completed) {
                                    setTimeout(() => {
                                        updateContextData({ tabType: contextData.tabType });
                                    }, 200);
                                    return;
                                }
                            }
                            updateContextData({ tabType: toTabType });
                        }}
                    />
                </Row>

                {renderChildren}
            </Content>
        </Layout>
    );
}
