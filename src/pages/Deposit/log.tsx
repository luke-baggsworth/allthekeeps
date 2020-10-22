import {css} from "emotion";
import {TimeToNow} from "../../components/FormattedTime";
import {Address, BitcoinAddress, Transaction} from "../../components/Address";
import React from "react";
import BitcoinHelpers from "../../utils/BitcoinHelpers";
import { gql } from '@apollo/client';
import {GetDepositLogsQuery} from "../../generated/graphql";
import { useTranslation } from 'react-i18next';
import i18n from './../../i18n';
import {useQueryWithTimeTravel} from "../../TimeTravel";

export function Log(props: {
  depositId: string
}) {
  const {loading, error, data} = useQueryWithTimeTravel<GetDepositLogsQuery>(gql`
      query GetDepositLogs($depositId: String!, $block: Block_height)
      {
          events(where: {deposit: $depositId}, orderBy: timestamp, orderDirection: desc, block: $block) {
              __typename,
              id,
              transactionHash,
              submitter,
              timestamp,

              ...on RegisteredPubKeyEvent {
                  signingGroupPubkeyX,
                  signingGroupPubkeyY
              }
              
              ...on StartedLiquidationEvent {
                  cause
              },

              ...on SetupFailedEvent {
                  reason,
                  deposit {
                      bondedECDSAKeep {
                          pubkeySubmissions { address },
                          members { address }
                      }
                  }
              }
          }
      }
  `, {variables: {depositId: props.depositId}});
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {"" + error}</p>;

  return <>
    {data!.events.map((logEntry: any) => {
      return <LogEntry key={logEntry.id} event={logEntry}/>
    })}
  </>
}

function LogEntry(props: {
  event: any
}) {
  const {event} = props;

  let Component = ({
    'CreatedEvent': CreatedEvent,
    'RegisteredPubKeyEvent': RegisteredPubKeyEvent,
    'FundedEvent': FundedEvent,
    'StartedLiquidationEvent': StartedLiquidationEvent,
    'RedemptionRequestedEvent': RedemptionRequestedEvent,
    'GotRedemptionSignatureEvent': GotRedemptionSignatureEvent,
    'RedeemedEvent': RedeemedEvent,
    'SetupFailedEvent': SetupFailedEvent,
    'LiquidatedEvent': LiquidatedEvent,
  } as any)[event.__typename] || UnknownEvent;


  return <div style={{marginBottom: '20px'}}>
    <div className={css`    
      font-size: 0.85em;
      margin-bottom: 0.4em;
      color: gray;
    `}>
      <TimeToNow time={event.timestamp}/> @ <Transaction tx={event.transactionHash}/> by <Address address={event.submitter}/>
    </div>
    <div>
      <Component event={event}/>
    </div>
  </div>
}

function LogTitle(props: {
  children: any
}) {
  return <div style={{marginBottom: '0.2em'}}><strong>{props.children}</strong></div>;
}

function UnknownEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  return <div>{t('deposit$.log$.unknown_event')}: {props.event.__typename}</div>
}

function CreatedEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  return <div>
    <LogTitle>{t('deposit$.log$.deposit_created')}</LogTitle>
  </div>
}

function RegisteredPubKeyEvent(props: {
  event: any
}) {
  // Triggered when retrieveSignerPubkey() is called
  // TODO: Can we get this earlier?
  const { t } = useTranslation();
  const event = props.event;
  const address = BitcoinHelpers.Address.publicKeyPointToP2WPKHAddress(event.signingGroupPubkeyX, event.signingGroupPubkeyY, "main");

  return <div>
    <LogTitle>{t('deposit$.log$.address_provided')}</LogTitle>
    <div>{t('deposit$.log$.address_provided_info')}: <BitcoinAddress address={address}/></div>
  </div>
}

function FundedEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  return <div>
    <LogTitle>{t('deposit$.log$.funded')}</LogTitle>
  </div>
}

// Triggered via VM.tbtcToBtc(), or Deposit.transferAndRequestRedemption()
function RedemptionRequestedEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  return <div>
    <LogTitle>{t('deposit$.log$.redemption_requested')}</LogTitle>
    <div>

    </div>
  </div>
}

export function getLiquidationCauseAsString(cause: string) {
  const t = i18n.t.bind(i18n)
  return ({
    'FRAUD': t('deposit$.log$.singer_fraud'),
    'PROOF_TIMEOUT': t('deposit$.log$.singer_timeout'),
    'SIGNATURE_TIMEOUT': t('deposit$.log$.singer_timeout'),
    'UNDERCOLLATERIZED': t('deposit$.log$.undercollaterialized')
  } as any)[cause] || cause;
}

function StartedLiquidationEvent(props: {
  event: any
}) {
  const {cause} = props.event;
  const title: string = getLiquidationCauseAsString(cause);
  const { t } = useTranslation();

  const description: string = ({
    'FRAUD': t('deposit$.log$.desc_fraud'),
    'PROOF_TIMEOUT': t('deposit$.log$.desc_proof_timeout'),
    'SIGNATURE_TIMEOUT': t('deposit$.log$.desc_sign_timeout'),
    'UNDERCOLLATERIZED': t('deposit$.log$.desc_undercollateralized')
  } as any)[cause];

  return <div>
    <LogTitle>{t('deposit$.log$.liquidation_started')}: {title}</LogTitle>
    <div>
      {description}
    </div>
  </div>
}

function LiquidatedEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  return <div>
    <LogTitle>{t('deposit$.log$.liquidated')}</LogTitle>
  </div>
}

function SetupFailedEvent(props: {
  event: any
}) {
  const { t } = useTranslation();
  let content: any;
  if (props.event.reason == 'FUNDING_TIMEOUT' || props.event.reason == 'SIGNER_SETUP_FAILED_DEPOSITOR') {
    content = <>
      <LogTitle>{t('deposit$.log$.not_funded')}</LogTitle>
      <div>
        {t('deposit$.log$.not_funded_info')}
      </div>
      {/*<div style={{color: 'gray', fontSize: '0.9em'}}>*/}
      {/*  The depositor has 3 hours to send the desired amount of Bitcoins to the address provided by the signers.*/}
      {/*  Failure to do so, as*/}
      {/*</div>*/}
    </>
  }
  else if (props.event.reason == 'SIGNER_SETUP_FAILED') {
    const allSigners = props.event.deposit.bondedECDSAKeep.members.map((s: any) => s.address);
    const goodSigners = new Set(props.event.deposit.bondedECDSAKeep.pubkeySubmissions.map((s: any) => s.address));
    const badSigners: string[] = allSigners.filter((s: any) => !goodSigners.has(s));

    content = <>
      <LogTitle>{t('deposit$.log$.failed_singer_setup')}</LogTitle>
      <div>
        {t('deposit$.log$.failed_singer_setup_info')}: {badSigners.map(address => <Address to={`/operator/${address}`} address={address} />).reduce((prev, curr) => [prev, ', ', curr] as any, "")}
      </div>
      {/*<div style={{color: 'gray', fontSize: '0.9em'}}>*/}
      {/*  The depositor has 3 hours to send the desired amount of Bitcoins to the address provided by the signers.*/}
      {/*  Failure to do so, as*/}
      {/*</div>*/}
    </>
  }
  else {
    content = <>
      <LogTitle>{t('deposit$.log$.failed_setup')}</LogTitle>
      <div>
        {t('deposit$.log$.reason')}: {props.event.reason}
      </div>
    </>
  }
  return <div>
    {content}
  </div>
}

function GotRedemptionSignatureEvent(props: {
  event: any
}) {
  // Signers call provideRedemptionSignature(). They provide a signature over a pay-out transaction that would
  // release the funds.
  const { t } = useTranslation();
  return <div>
    <LogTitle>
      {t('deposit$.log$.singer_sign')}
    </LogTitle>
    <div>
      {t('deposit$.log$.singer_sign_info')}
    </div>
  </div>
}

function RedeemedEvent(props: {
  event: any
}) {
  // # Triggered when provideRedemptionProof() is called - confirmations
  const { t } = useTranslation();
  return <div>
    <LogTitle>{t('deposit$.log$.redeemed')}</LogTitle>
  </div>
}