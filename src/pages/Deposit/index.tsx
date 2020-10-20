import {gql, useQuery, useSubscription} from "@apollo/client";
import React, {useState} from "react";
import {useParams} from 'react-router';
import {getSatoshisAsBitcoin} from "../../utils/getSatoshisAsBitcoin";
import {TimeToNow} from "../../components/FormattedTime";
import {css} from "emotion";
import {Address, BitcoinAddress} from "../../components/Address";
import {Paper} from "../../design-system/Paper";
import {NiceStateLabel} from "../../utils/depositStates";
import {
  getTDTTokenAddress,
  getVendingMachineAddress,
  hasDepositBeenUsedToMint,
  isVendingMachine,
} from "../../utils/contracts";
import {InfoTooltip} from "../../components/InfoTooltip";
import {Helmet} from "react-helmet";
import {getWeiAsEth} from "../../utils/getWeiAsEth";
import {CollaterizationStatus} from "../../components/CollateralizationStatus";
import {Box} from "../../components/Box";
import {Button} from "../../design-system/Button";
import {Log} from "./log";
import {useDAppDomain, useEtherscanDomain} from "../../NetworkContext";
import {useBtcAddressFromPublicKey} from "../../utils/useBtcAddressFromPublicKey";
import {StatusBox} from "./StatusBox";
import { useTranslation } from 'react-i18next';


const DEPOSIT_QUERY = gql`
    query GetDeposit($id: ID!) {
        deposit(id: $id) {
            id,
            contractAddress,
            currentState,
            createdAt,
            keepAddress,
            lotSizeSatoshis,
            endOfTerm,

            currentStateTimesOutAt,
            
            tdtToken {
                id,
                tokenID,
                owner,
                minter
            }

            initialCollateralizedPercent,
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
            },
            
            depositLiquidation {
                cause
            }
            
            ...NiceStateLabel
        }
    }
  
    ${NiceStateLabel}
`;

const DEPOSIT_SUBSCRIPTION = gql`
    subscription WatchDeposit($id: ID!) {
        deposit(id: $id) {
            id
            currentState
        }
    }
`;

const formatter = new Intl.NumberFormat("en-US", {
  style: 'percent',
  maximumFractionDigits: 2
});


export function Deposit() {
  const { t } = useTranslation();
  return <div className={css`
      padding: 1em;
    `}>
    <Helmet>
      <title>{t('deposit')}</title>
    </Helmet>
    <Content />
  </div>
}


export function Content() {
  let { depositId } = useParams<any>();
  const { loading, error, data } = useQuery(DEPOSIT_QUERY, {variables: {id: depositId}});
  useSubscription(DEPOSIT_SUBSCRIPTION, { variables: { id: depositId } });
  const etherscan = useEtherscanDomain();
  const dAppDomain = useDAppDomain();
  const { t } = useTranslation();

  const btcAddress = useBtcAddressFromPublicKey(data?.deposit.bondedECDSAKeep.publicKey);

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  const canBeRedeemed = ['ACTIVE', 'COURTESY_CALL'].indexOf(data.deposit.currentState) > -1;
  const isAtTerm = false;  // XXX still needs to be fixed
  const canBeRedeemedByAnyone = canBeRedeemed && (data.deposit.currentState == 'COURTESY_CALL' || isAtTerm || isVendingMachine(data.deposit.tdtToken.owner));

  return <div>
    <div className={css`
      display: flex;
      flex-direction: row;
      & > * {
        margin-right: 20px;
      }
  `}>
      <Box label={t('deposit$.lot_size')}>
        {getSatoshisAsBitcoin(data.deposit.lotSizeSatoshis)} BTC
      </Box>

      <StatusBox deposit={data.deposit} />

      <Box label={t('deposit$.creation')}>
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
            {t('deposit$.ownership')} <InfoTooltip>
              {t('deposit$.ownership_tooltip')}
            </InfoTooltip>
          </div>
          <div className={css`
          `}>
            {
              hasDepositBeenUsedToMint(data.deposit.tdtToken.owner, data.deposit.currentState)
                  ? <div>
                    {t('deposit$.ownership_info1')} <a href={`https://${etherscan}/address/${getVendingMachineAddress()}`}>{t('deposit$.ownership_info1_link')}</a>.
                  </div>
                  : (data.deposit.tdtToken.owner == data.deposit.tdtToken.minter) ? <div>
                    {t('deposit$.ownership_info2')}, <Address address={data.deposit.tdtToken.owner} />.
                  </div> : <div>
                    {t('deposit$.ownership_info3')} <Address address={data.deposit.tdtToken.owner} />.
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
            <a href={`https://${etherscan}/token/${getTDTTokenAddress()}?a=${data.deposit.tdtToken.tokenID}`}>{t('deposit$.tdt_token')}</a>
          </div>

          {(canBeRedeemedByAnyone) ?
            <div style={{marginTop: 20}}>
              {t('deposit$.can_redeemed_info1')} <InfoTooltip>{t('deposit$.can_redeemed_info2')}</InfoTooltip>
              <div style={{marginTop: '8px'}}><Button size={"small"} to={`https://${dAppDomain}/deposit/${data.deposit.contractAddress}/redeem`}>
                {t('deposit$.redeem')}
              </Button></div>
            </div>
          : null }
        </Paper>

        <div style={{marginTop: '20px'}}>
          <Paper>
            <PropertyTable
                data={[
                  {
                    key: 'tokenOwner',
                    label: t('deposit$.owner'),
                    tooltip: t('deposit$.owner_tooltip'),
                    value: <Address address={data.deposit.tdtToken.owner} />
                  },
                  {
                    key: 'tokenMinter',
                    label: t('deposit$.creator'),
                    tooltip: t('deposit$.creator_tooltip'),
                    value: <Address address={data.deposit.tdtToken.minter}  />
                  },
                  {
                    key: 'tokenId',
                    label: t('deposit$.token_id'),
                    value: <Address address={data.deposit.tdtToken.tokenID} to={`https://${etherscan}/token/${getTDTTokenAddress()}?a=${data.deposit.tdtToken.tokenID}`}  />
                  },
                  data.deposit.endOfTerm ? {
                    key: 'endOfTerm',
                    label: t('deposit$.end_of_term'),
                    tooltip: t('deposit$.end_of_term_tooltip'),
                    value: <TimeToNow time={data.deposit.endOfTerm} />
                  } : undefined,
                  {
                    key: 'depositContract',
                    label: t('deposit$.dep_contract'),
                    value: <Address address={data.deposit.contractAddress}  />
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
            {t('deposit$.keep')} <InfoTooltip>
              {t('deposit$.keep_tooltip')}
            </InfoTooltip>
          </div>
          <PropertyTable data={[
            {
              key: 'signers',
              label: t('deposit$.singers'),
              tooltip: t('deposit$.singers_tooltip'),
              value: <div>
                {data.deposit.bondedECDSAKeep.members.map((m: any) => {
                  return <div key={m.address}>
                    <Address address={m.address} to={`/operator/${m.address}`} />
                  </div>
                })}
              </div>
            },
            {
              key: 'bondedAmount',
              label: t('deposit$.bond'),
              tooltip: t('deposit$.bond_tooltip'),
              value: <span>{getWeiAsEth(data.deposit.bondedECDSAKeep.totalBondAmount).toFixed(2)} ETH</span>
            },
            {
              key: 'collateralization',
              label: t('deposit$.collaterialization'),
              tooltip: t('deposit$.collaterialization_tooltip'),
              value: <CollaterizationStatus deposit={data.deposit} highlightNormal={true} style={{fontWeight: 'bold'}} />
            },
            {
              key: 'thresholds',
              label: t('deposit$.thresholds'),
              tooltip: t('deposit$.thresholds_tooltip'),
              value: <span>
                {formatter.format(data.deposit.initialCollateralizedPercent / 100)}<span style={{color: 'silver'}}> / </span>{formatter.format(data.deposit.undercollateralizedThresholdPercent / 100)}<span style={{color: 'silver'}}> / </span>{formatter.format(data.deposit.severelyUndercollateralizedThresholdPercent / 100)}
              </span>
            },
            {
              key: 'honestThreshold',
              label: t('deposit$.honest_threshold'),
              tooltip: t('deposit$.honest_threshold_tooltip'),
              value: <span>{formatter.format(data.deposit.bondedECDSAKeep.honestThreshold / data.deposit.bondedECDSAKeep.members.length)}</span>
            },
            {
              key: 'keepAddress',
              label: t('deposit$.contract_address'),
              tooltip: t('deposit$.contract_address_tooltip'),
              value: <Address address={data.deposit.keepAddress} />
            },
            btcAddress ? {
              key: 'publicKey',
              label: t('deposit$.BTC_address'),
              value: <BitcoinAddress address={btcAddress} />
            } : undefined,
            {
              key: 'status',
              label: t('deposit$.status'),
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
        <h3 style={{marginTop: 0}}>{t('deposit$.log')}</h3>
        {/*<div style={{marginBottom: '20px'}}>*/}
        {/*  <div><strong>Next Step</strong></div>*/}
        {/*  The depositor must submit proof of having sent to Bitcoin to the deposit address, once at least 6 confirmations have been reached. <TimeToNow time={data.deposit.currentStateTimesOutAt} /> left to do so.*/}
        {/*</div>*/}
        <Log depositId={data.deposit.id} />
      </div>
    </Paper>
  </div>
}



function PropertyTable(props: {
  data: (undefined|{
    key: string,
    label: string,
    tooltip?: string,
    value: any
  })[]
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
        if (!row) { return null; }
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
