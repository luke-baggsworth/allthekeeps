import Tippy, {useSingleton} from "@tippyjs/react";
import {css} from "emotion";
import {InfoTooltip} from "../../components/InfoTooltip";
import {TimeToNow} from "../../components/FormattedTime";
import {Link} from "react-router-dom";
import {ExternalLinkIcon} from "../../components/ExternalLinkIcon";
import {getSatoshisAsBitcoin} from "../../utils/getSatoshisAsBitcoin";
import {
  getNiceStateLabel,
  getStateBoxStyle,
  useTimeRemaining
} from "../../utils/depositStates";
import {hasDepositBeenUsedToMint} from "../../utils/contracts";
import {TBTCIcon} from "../../design-system/tbtcIcon";
import React from "react";
import {CollaterizationStatusWithPrice} from "../../components/CollateralizationStatus";
import {usePriceFeed} from "../../components/PriceFeed";
import { Table } from "../../components/Table";
import {useEtherscanDomain} from "../../NetworkContext";
import {useBitcoinTxState} from "../../utils/useBitcoinTxState";
import {useBtcAddressFromPublicKey} from "../../utils/useBtcAddressFromPublicKey";
import {LabelWithBackgroundProgress} from "../Deposit/StatusBox";
import {BTCTag} from "../../components/CurrencyTags";
import {UseDepositQuery, useDepositQuery} from "./Views";
import { useTranslation } from 'react-i18next';

export function DepositsTable(props: {
  query: UseDepositQuery
}) {
  const {loading, error, dateColumn, view, data} = props.query;
  const [source, target] = useSingleton();
  const price = usePriceFeed();
  const etherscan = useEtherscanDomain();
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  return <>
    <Tippy singleton={source} delay={500} />
    <Table
        style={{width: '100%'}}
    >
      <thead>
      <tr>
        {
          (dateColumn == "updatedAt") ? <th>{t('deposits.table.updated')} <InfoTooltip>
            {t('deposits.table.updated_tooltip')}
          </InfoTooltip></th>
              :
              (dateColumn == "redemptionStartedAt") ? <th>{t('deposits.table.started')} <InfoTooltip>
                {t('deposits.table.started_tooltip')}
              </InfoTooltip></th>
                  : <th>{t('deposits.table.created')} <InfoTooltip>
                    {t('deposits.table.created_tooltip')}
                  </InfoTooltip></th>
        }

        <th>
          {t('deposits.table.contract')} <InfoTooltip>
          {t('deposits.table.contract_tooltip')}
        </InfoTooltip>
        </th>
        <th>{t('deposits.table.lot_size')}</th>
        <th>{t('deposits.table.state')}</th>
      </tr>
      </thead>
      <tbody>
      {data.deposits.map((deposit: any) => {
        return <DepositRow
          deposit={deposit}
          key={deposit.id}
          dateColumn={dateColumn}
          etherscan={etherscan}
          price={price}
          target={target}
        />
      })}
      </tbody>
    </Table>
  </>;
}

const DepositRow = React.memo((props: {
  deposit: any,
  dateColumn: string,
  etherscan: string,
  price: any,
  target: any
}) => {
  const {deposit, dateColumn, etherscan, price, target} = props;
  const { t } = useTranslation();
  return  <tr key={deposit.id}>
    <td>
      <TimeToNow time={deposit[dateColumn]} />
    </td>
    <td>
      <Link to={`/deposit/${deposit.id}`}>
        {deposit.contractAddress}
      </Link>
      <a title={t('deposits.table.open_etherscan')} href={`https://${etherscan}/address/${deposit.contractAddress}`} className={css`
                font-size: 0.8em;
                padding-left: 0.2em;
               `}>
        <ExternalLinkIcon />
      </a>
    </td>
    <td>
      <BTCTag />&nbsp;{getSatoshisAsBitcoin(deposit.lotSizeSatoshis ?? 0)}
    </td>
    <td className={css`
            display: flex;
            align-items: center;
          `}>
      <div className={css`
              display: inline-block;
              width: 1.2em;
              height: 1.2em;
              border-radius: 2px;
              padding: 0.2em;
              box-sizing: border-box;
            `} style={getStateBoxStyle(deposit.currentState)}>
      </div>
      &nbsp;
      {hasDepositBeenUsedToMint(deposit.tdtToken.owner, deposit.currentState)
          ? <><Tippy content={t('deposits.table.tbtc_minted')} singleton={target}><TBTCIcon /></Tippy>&nbsp;</>
          : ""
      }
      <StateLabelWithProgressBar deposit={deposit} />

      <FundingStatus deposit={deposit}/>
    </td>
    <td>
      <CollaterizationStatusWithPrice deposit={deposit} price={price} />
    </td>
  </tr>
});


export function StateLabelWithProgressBar(props: {
  deposit: any
}) {
  const { t } = useTranslation();
  const timing = useTimeRemaining(props.deposit, 5);
  return <LabelWithBackgroundProgress
      progress={timing?.percentage}
  >
    {t(getNiceStateLabel(props.deposit))}
  </LabelWithBackgroundProgress>
}


function FundingStatus(props: {
  deposit: any
}) {
  const btcAddress = useBtcAddressFromPublicKey(props.deposit.bondedECDSAKeep.publicKey);
  const isEnabled = !!btcAddress && props.deposit.currentState == 'AWAITING_BTC_FUNDING_PROOF'
  const state = useBitcoinTxState(btcAddress, props.deposit.lotSizeSatoshis ?? 0, isEnabled);
  return isEnabled ? <>
    {state?.hasTransaction ? <>
      <span style={{color: 'silver', fontSize: '.8em', paddingLeft: '5px'}}>({state.numConfirmations}/6)</span>
    </>: null}
  </> : null;
}