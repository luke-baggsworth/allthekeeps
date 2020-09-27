import {gql, useQuery} from "@apollo/client";
import React from "react";
import {useParams} from 'react-router';
import { Link } from "react-router-dom";
import {getSatoshisAsBitcoin} from "../utils/getSatoshisAsBitcoin";
import {TimeToNow} from "../components/FormattedTime";
import {css} from "emotion";
import {Address, Transaction} from "../components/Address";
import { Paper } from "../design-system/Paper";
import {getNiceStateLabel, getStateTooltip} from "../utils/depositStates";
import {
  getTDTTokenAddress,
  getVendingMachineAddress,
  hasDepositBeenUsedToMint,
  isVendingMachine
} from "../utils/contracts";
import {InfoTooltip} from "../components/InfoTooltip";
import {TBTCIcon} from "../design-system/tbtcIcon";
import {Helmet} from "react-helmet";
import {SetupFailed} from "../../../keep-subgraph/generated/TBTCSystem/TBTCSystem";
import BitcoinHelpers from "../utils/BitcoinHelpers";
import {getWeiAsEth} from "../utils/getWeiAsEth";


const DEPOSIT_QUERY = gql`
    query GetDeposit($id: String!) {
        deposit(id: $id) {
            id,
            contractAddress,
            currentState,
            createdAt,
            keepAddress,
            lotSizeSatoshis,

            tbtcSystem,
            tdtToken {
                id,
                tokenID,
                owner,
                minter
            }

            initialCollateralizedPercent,
            collateralizationPercent,
            undercollateralizedThresholdPercent,
            severelyUndercollateralizedThresholdPercent,
            
            bondedECDSAKeep {
                id,
                keepAddress,
                totalBondAmount,
                publicKey,
                status,
                honestThreshold,
                members {
                    id,
                    address
                }
            }
        }
    }
`;

const formatter = new Intl.NumberFormat("en-US", {
  style: 'percent',
  maximumFractionDigits: 2
});


export function Deposit() {
  return <div className={css`
      padding: 1em;
    `}>
    <Helmet>
      <title>Deposit</title>
    </Helmet>
    <Content />
  </div>
}

export function Content() {
  let { depositId } = useParams<any>();
  const { loading, error, data } = useQuery(DEPOSIT_QUERY, {variables: {id: depositId}});

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :( {""+ error}</p>;

  return <div>
    <div className={css`
      display: flex;
      flex-direction: row;
      & > * {
        margin-right: 20px;
      }
  `}>
      <Box label={"lot size"}>
        {getSatoshisAsBitcoin(data.deposit.lotSizeSatoshis)} BTC
      </Box>

      <Box label={"state"}>
        <div>
          {getNiceStateLabel(data.deposit.currentState)} {getStateTooltip(data.deposit.currentState)
            ? <span className={css`position: relative; top: -0.5em; font-size: 0.6em;`}><InfoTooltip>{getStateTooltip(data.deposit.currentState)}</InfoTooltip></span>
            : null}
        </div>
        {
          hasDepositBeenUsedToMint(data.deposit.tdtToken.owner, data.deposit.currentState)
              ? <div className={css`
                  font-size: 0.6em;
                  display: flex;
                  flex-direction: row;
                  align-items: center;
              ` }>
                <TBTCIcon /> <span style={{paddingLeft: 5}}>tBTC minted</span>
                </div>
              : null
        }
      </Box>

      <Box label={"creation date"}>
        <TimeToNow time={data.deposit.createdAt} />
      </Box>
    </div>

    <div style={{
      display: "flex",
      flexDirection: "row",
      marginTop: '20px'
    }}>
      <div style={{marginRight: '20px', flex: 1}}>
        <Paper padding>
          <div className={css`
            font-weight: bold;
            margin-bottom: 0.5em;
          `}>
            Ownership <InfoTooltip>
              For every deposit, a non-fungible TDT Token is minted. Whoever owns this token, owns the deposit.
            </InfoTooltip>
          </div>
          <div className={css`
          `}>
            {
              hasDepositBeenUsedToMint(data.deposit.tdtToken.owner, data.deposit.currentState)
                  ? <div>
                    This deposit has been used to mint <strong>tBTC</strong>. The corresponding TDT token is now
                    owned by the <a href={`https://etherscan.io/address/${getVendingMachineAddress()}`}>Vending Machine contract</a>.
                  </div>
                  : (data.deposit.tdtToken.owner == data.deposit.tdtToken.minter) ? <div>
                    The TDT Token representing ownership over this deposit is owned by the original
                    deposit creator, <Address address={data.deposit.tdtToken.owner} />.
                  </div> : <div>
                    The TDT Token representing ownership over this deposit is owned by <Address address={data.deposit.tdtToken.owner} />.
                  </div>
            }
          </div>
          <div className={css`
            font-size: 0.8em;
            margin-top: 10px;
            & a, a:visited {
              color: gray;
            }            
          `}>
            <a href={`https://etherscan.io/token/${getTDTTokenAddress()}?a=${data.deposit.tdtToken.tokenID}`}>TDT Token on Etherscan</a>
          </div>
        </Paper>

        <div style={{marginTop: '20px'}}>
          <Paper>
            <PropertyTable
                data={[
                  {
                    key: 'tokenOwner',
                    label: "Current Owner",
                    tooltip: "Deposit owner as represented by ownership over the TDT token",
                    value: <Address address={data.deposit.tdtToken.owner} />
                  },
                  {
                    key: 'tokenMinter',
                    label: "Creator",
                    tooltip: "Original creator of this deposit",
                    value: <Address address={data.deposit.tdtToken.minter}  />
                  },
                  {
                    key: 'depositContract',
                    label: "Deposit Contract",
                    value: <Address address={data.deposit.contractAddress}  />
                  },
                  {
                    key: 'tbtcSystem',
                    label: "tBTC contract",
                    value: <Address address={data.deposit.tbtcSystem} />
                  }
                ]}
            />
          </Paper>
        </div>
      </div>

      <div style={{flex: 1}}>
        <Paper>
          <div className={css`
            font-weight: bold;
            padding: 20px;
            padding-bottom: 0;
          `}>
            Keep <InfoTooltip>
              The Keep holds the original BTC in custody, and signers stake ETH as a security bond.
            </InfoTooltip>
          </div>
          <PropertyTable data={[
            {
              key: 'signers',
              label: "Signers",
              tooltip: "The node operators collectively holding the Bitcoin private key",
              value: <div>
                {data.deposit.bondedECDSAKeep.members.map((m: any) => {
                  return <div>
                    <Address address={m.address} to={`/operator/${m.address}`} />
                  </div>
                })}
              </div>
            },
            {
              key: 'bondedAmount',
              label: "Bond",
              tooltip: "The total value the signers have bonded to guarantee this deposit.",
              value: <span>{getWeiAsEth(data.deposit.bondedECDSAKeep.totalBondAmount).toFixed(2)} ETH</span>
            },
            {
              key: 'honestThreshold',
              label: "Honest Threshold",
              tooltip: "How many signers must be honest for the bond not be lost.",
              value: <span>{formatter.format(data.deposit.bondedECDSAKeep.honestThreshold / data.deposit.bondedECDSAKeep.members.length)}</span>
            },
            {
              key: 'thresholds',
              label: "Thresholds",
              tooltip: "The collateralization requirements for this deposit: Initial / Courtesy Call / Liquidation",
              value: <span>
                {formatter.format(data.deposit.initialCollateralizedPercent / 100)}<span style={{color: 'silver'}}> / </span>{formatter.format(data.deposit.undercollateralizedThresholdPercent / 100)}<span style={{color: 'silver'}}> / </span>{formatter.format(data.deposit.severelyUndercollateralizedThresholdPercent / 100)}
              </span>
            },
            {
              key: 'keepAddress',
              label: "Contract Address",
              tooltip: "The contract managing the keep",
              value: <Address address={data.deposit.keepAddress} />
            },
            {
              key: 'publicKey',
              label: "Public Key",
              value: data.deposit.bondedECDSAKeep.publicKey
            },
            {
              key: 'status',
              label: "Status",
              value: data.deposit.bondedECDSAKeep.status
            }
          ]} />
        </Paper>
      </div>
    </div>

    <Paper>
      <div className={css`           
        padding: 20px;
      `}>
        <h3 style={{marginTop: 0}}>Log</h3>
        <Log depositId={data.deposit.id} />
      </div>
    </Paper>
  </div>
}

function PropertyTable(props: {
  data: {
    key: string,
    label: string,
    tooltip?: string,
    value: any
  }[]
}) {
  return <table className={css`
      color: #0A0806;
      padding: 15px;
      
      & td, th {
        font-weight: normal;
        padding: 5px;
        text-align: left;
        vertical-align: top;
      }
    `}>
      <tbody>
      {props.data.map(row => {
        return <tr key={row.key}>
          <th>
            {row.label} {row.tooltip ? <InfoTooltip>{row.tooltip}</InfoTooltip> : null}
          </th>
          <td>{row.value}</td>
        </tr>
      })}
      </tbody>
    </table>
}

function Box(props: {
  label: string,
  children: any
}) {
  return (
    <div className={css`
      font-size: 35px;           
      padding: 20px;
      color: #0A0806;
      
      font-feature-settings: 'zero' on;
    `}>
        <div className={css`                         
          font-size: 16px;
        `}>
          {props.label}
        </div>
        <div>
          {props.children}
        </div>
    </div>
  )
}


function Log(props: {
  depositId: string
}) {
  const { loading, error, data } = useQuery(gql`
      query GetDepositLogs($depositId: ID!)
        {
            events(where: {deposit: $depositId}, orderBy: timestamp, orderDirection:desc) {
                __typename,
                id,
                transactionHash,
                timestamp,
                
                ...on RegisteredPubKeyEvent {
                    signingGroupPubkeyX,
                    signingGroupPubkeyY
                }
            }
        }
  `, {variables: {depositId: props.depositId}});

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :( {""+ error}</p>;

  return data.events.map((logEntry: any) => {
    return <LogEntry event={logEntry} />
  })
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
  } as any)[event.__typename] || UnknownEvent;


  return <div style={{marginBottom: '20px'}}>
    <div className={css`    
      font-size: 0.85em;
      margin-bottom: 0.4em;
    `}>
      <TimeToNow time={event.timestamp} /> @ <Transaction tx={event.transactionHash} />
    </div>
    <div>
      <Component event={event} />
    </div>
  </div>
}


function UnknownEvent(props: {
  event: any
}) {
  return <div>Unknown Event: {props.event.__typename}</div>
}

function CreatedEvent(props: {
  event: any
}) {
  return <div>
    <strong>Deposit created</strong>
  </div>
}

function RegisteredPubKeyEvent(props: {
  event: any
}) {
  // Triggered when retrieveSignerPubkey() is called
  // TODO: Can we get this earlier?

  const event = props.event;
  const address = BitcoinHelpers.Address.publicKeyPointToP2WPKHAddress(event.signingGroupPubkeyX, event.signingGroupPubkeyY, "main")

  return <div>
    <strong>Bitcoin Address provided</strong>
    <div>Signers have provided a Bitcoin address to deposit things in: {address}</div>
  </div>
}

function FundedEvent(props: {
  event: any
}) {
  return <div>
    <strong>Funded</strong>
  </div>
}

// TODO: This would happen multiple times if a fee increase is requested via increaseRedemptionFee()
// Triggered via VM.tbtcToBtc(), or Deposit.transferAndRequestRedemption()
function RedemptionRequestedEvent(props: {
  event: any
}) {

  return <div>
    <strong>Redemption Requested</strong>
    <div>
      sdf
    </div>
  </div>
}

function StartedLiquidationEvent(props: {
  event: any
}) {
  return <div>
    <strong>Liquidation Started</strong>
  </div>
}

// For exampe, due to: notifyFundingTimedOut, provideFundingECDSAFraudProof, notifySignerSetupFailed
function SetupFailedEvent(props: {
  event: any
}) {
  return <div>
    <strong>Setup Failed</strong>
  </div>
}

function GotRedemptionSignatureEvent(props: {
  event: any
}) {
  // Signers call provideRedemptionSignature(). They provide a signature over a pay-out transaction that would
  // release the funds.
  return <div>
    <strong>
      Signers provided a redemption signature
    </strong>
    <div>
      The signers provided a signature for the redemption Bitcoin transaction.
    </div>
  </div>
}


function RedeemedEvent(props: {
  event: any
}) {
  // # Triggered when provideRedemptionProof() is called - confirmations
  return <div>
    <strong>Redeemed</strong>
  </div>
}