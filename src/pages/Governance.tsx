import {gql, useQuery} from "@apollo/client";
import React from "react";
import {Paper} from "../design-system/Paper";
import {css} from "emotion";
import {Address, Transaction} from "../components/Address";
import {ExternalLinkIcon} from "../components/ExternalLinkIcon";
import {InfoTooltip} from "../components/InfoTooltip";
import {getSatoshisAsBitcoin} from "../utils/getSatoshisAsBitcoin";
import { Helmet } from "react-helmet";
import { Table } from "../components/Table";
import {FormattedTime, TimeToNow} from "../components/FormattedTime";
import {ExplainerIcon} from "../components/ExplainerIcon";
import {usePriceFeed} from "../components/PriceFeed";
import {getWeiAsEth} from "../utils/getWeiAsEth";
import { useTranslation } from 'react-i18next';

const GOVERNANCE_QUERY = gql`
    fragment Change on GovernanceChange {
        type,
        requestedAt,
        takesEffectAfter,
        
        newLotSizes,
        newFactorySelector,
        newFullyBackedFactory,
        newKeepStakedFactory,
    }
    
    query GetGovernance {
        governance(id: "GOVERNANCE") {
            newDepositsAllowed
            
            lotSizes,
            pendingLotSizeChange { ...Change },
            
            factorySelector,
            fullyBackedFactory,
            keepStakedFactory,
            pendingFactoriesChange { ...Change },

            signerFeeDivisor,
            pendingSignerFeeDivisorChange { ...Change },

            initialCollateralizedPercent,
            severelyUndercollateralizedThresholdPercent,
            undercollateralizedThresholdPercent,
            
            priceFeeds,
        },
        
        governanceLogEntries(first: 300, orderBy: timestamp, orderDirection: desc) {
            id,
            timestamp,
            transactionHash,
            submitter,
            isRequest,
            change {
                ...Change
            }
        }
    }
`;


export function Governance() {
  const { t } = useTranslation();
  return  <div style={{padding: '20px'}}>
    <Helmet>
      <title>{t('header.governance')}</title>
    </Helmet>
    <h1 style={{marginTop: 0}}>{t('header.governance')}</h1>
    <Content />
  </div>
}


export function Content() {
  const { loading, error, data } = useQuery(GOVERNANCE_QUERY);
  const { t } = useTranslation();

  if (loading) return <p>{t('loading')}...</p>;
  if (error) return <p>{t('error')} :( {""+ error}</p>;

  return <div>
    <div  style={{
      display: 'flex',
      flexDirection: 'row'
    }}>
      <Paper padding>
        <Block title={t('governance.deposits_enabled')} tooltip={t('governance.deposits_enabled_tooltip')}>
          {data.governance.newDepositsAllowed ? t('yes') : t('governance.emergency_break')}
        </Block>

        <Block title={t('governance.lot_sizes')} tooltip={t('governance.lot_sizes_tooltip')}>
          {formatLotSizes(data.governance.lotSizes)}
        </Block>

        <Block title={t('governance.singer_free')} tooltip={t('governance.singer_free_tooltip')}>
          {formatter.format(1 / data.governance.signerFeeDivisor)}
        </Block>

        <Block title={t('governance.factory_contracts')}>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.factory_selector')}: </span> <Address address={data.governance.factorySelector} />
          </div>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.fully_backed_factory')}: </span> <Address address={data.governance.fullyBackedFactory} />
          </div>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.keep_stacked_factory')}: </span> <Address address={data.governance.keepStakedFactory} />
          </div>
        </Block>

        <Block title={t('governance.collateralization_thresholds')}>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.initial_threshold')}: </span> {data.governance.initialCollateralizedPercent}%
          </div>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.undercollaterized_threshold')}: </span> {data.governance.undercollateralizedThresholdPercent}%
          </div>
          <div>
            <span style={{color: '#rgb(62 62 62)'}}>{t('governance.severly_undercollaterized')}: </span> {data.governance.severelyUndercollateralizedThresholdPercent}%
          </div>
        </Block>

        <Block title={t('governance.price_feeds')}>
          {data.governance.priceFeeds.map((feed: any) => {
            return <div><Address address={feed} /></div>
          })}
        </Block>
      </Paper>

      <div style={{flex: 0, minWidth: '400px', marginLeft: '40px'}}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
          <ExplainerIcon width={"2em"} height={"2em"}/>
          <strong style={{marginTop: 0, paddingLeft: '0.3em', fontSize: '1.2em'}}>{t('governance.info')}</strong>
        </div>
        {t('governance.info1')}: <strong>a)</strong> {t('governance.info2')}
        {" "}<strong>b)</strong> {t('governance.info3')}
      </div>

      <div style={{marginLeft: 20}}>
        <PriceInfo />
      </div>
    </div>

    <Paper padding style={{marginTop: '20px'}}>
      <h3 style={{marginTop: 0}}>Log</h3>

      <Table style={{width: '100%'}}>
        <thead>
          <tr>
            <th>{t('governance.date')}</th>
            <th style={{paddingBottom: 10}}>
              {t('governance.action')}
            </th>
            <th>{t('governance.submitter')}</th>
            <th>{t('governance.Transaction')}</th>
          </tr>
        </thead>
        <tbody>
          {data.governanceLogEntries.map((logEntry: any) => {
            return <LogEntry entry={logEntry} />
          })}
        </tbody>
      </Table>
    </Paper>
  </div>
}


function PriceInfo() {
  const price = usePriceFeed();
  const { t } = useTranslation();

  let content: any;
  if (!price) {
    content = '-';
  }
  else {
    content = <div>
      <div>{price.val.toFixed(5)} ETH</div>
      <div style={{
        marginTop: '0.5em',
        fontSize: '0.8em'
      }}>
        <TimeToNow time={price.timestamp} /> {t('governance.price_feed_in_block')} <Transaction tx={price.transactionHash}>{price.blockNumber}</Transaction>.
      </div>
    </div>
  }

  return <Paper padding>
    <Block title={t('governance.price_feed')} tooltip={t('governance.price_feed_tooltip')}>
      {content}
    </Block>
  </Paper>
}


function Block(props: {
  children?: any,
  title: string,
  tooltip?: string
}) {
  return <div style={{marginBottom: '15px'}}>
    <div><strong>{props.title} {props.tooltip ? <InfoTooltip>{props.tooltip}</InfoTooltip> : null}</strong></div>
    {props.children}
  </div>
}


const formatter = new Intl.NumberFormat("en-US", {
  style: 'percent',
  maximumFractionDigits: 2
});

function formatLotSizes(lotSizes: any) {
  return lotSizes.map((size: number) => {
    return getSatoshisAsBitcoin(size)
  }).join(", ") + " BTC"
}


function LogEntry(props: {
  entry: any
}) {
  const {entry, entry: {change: {type}, isRequest}} = props;
  let Component: any;

  if (type == 'LOT_SIZES') {
    if (isRequest) {
      Component = LotSizesChangeRequest;
    } else {
      Component = LotSizesChangeDone;
    }
  }
  else {
    Component = UnsupportedChange;
  }
  return <tr>
    <td>
      <TimeToNow time={props.entry.timestamp} />
    </td>
    <td>
      <Component entry={props.entry} />
    </td>
    <td>
      <Address address={props.entry.submitter} includeExternalIcon={true} />
    </td>
    <td>
      <Transaction tx={props.entry.transactionHash} includeExternalIcon={true} />
    </td>
  </tr>
}


function ActionDesc(props: {
  headline: string,
  children?: any
}) {
  return <>
    <div><strong>{props.headline}</strong></div>
    <div className={css`
      font-size: .9em;  
    `}>{props.children}</div>
  </>
}


function LotSizesChangeRequest(props: {
  entry: any
}) {
  const { t } = useTranslation();
  return <ActionDesc headline={t('governance.lot_sized_change_req_action')}>
    <div>
      {t('governance.lot_sized_change_req_lose')}: <span>{formatLotSizes(props.entry.change.newLotSizes)}</span>
    </div>
    {props.entry.isRequest ? <div>
      <span  className={css`
          color: gray;
      `}>
        {t('governance.applied')} <FormattedTime time={parseInt(props.entry.change.takesEffectAfter)} /> (48 {t('governance.hours')}).
      </span>
    </div> : null}
  </ActionDesc>
}


function LotSizesChangeDone(props: {
  entry: any
}) {
  const { t } = useTranslation();
  return <ActionDesc headline={t('governance.lot_sizes_change_action')}>
    <div>
      {t('governance.lot_sizes_change_now')}: {" "} <span>{formatLotSizes(props.entry.change.newLotSizes)}</span>
    </div>
  </ActionDesc>
}

function UnsupportedChange(props: {
  entry: any
}) {
  const { t } = useTranslation();
  if (props.entry.isRequest) {
    return <ActionDesc headline={t('governance.unsupported_change_action1')} />
  }
  return <ActionDesc headline={t('governance.unsupported_change_action2')} />
}